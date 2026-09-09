import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;

type Kind = 'expense_added' | 'item_added' | 'item_purchased' | 'debt_settled';

// The body is composed here, not sent by the client: otherwise any caller could
// push arbitrary text to their housemates. It also can't reuse the app's i18n
// bundle from the server, so the few strings it needs are duplicated per locale
// and picked by the language each device registered with.
const STRINGS = {
  tr: {
    expense_added: (actor: string, subject: string, amount: string) =>
      `${actor} harcama ekledi: ${subject} · ${amount}`,
    item_added: (actor: string, subject: string) => `${actor} listeye ekledi: ${subject}`,
    item_purchased: (actor: string, subject: string) => `${actor} aldı: ${subject}`,
    debt_settled: (actor: string, subject: string) => `${actor}, ${subject} ile hesabı kapattı`,
  },
  en: {
    expense_added: (actor: string, subject: string, amount: string) =>
      `${actor} added an expense: ${subject} · ${amount}`,
    item_added: (actor: string, subject: string) => `${actor} added to the list: ${subject}`,
    item_purchased: (actor: string, subject: string) => `${actor} bought: ${subject}`,
    debt_settled: (actor: string, subject: string) => `${actor} settled up with ${subject}`,
  },
} as const;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'missing_authorization' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;

  // Scoped to the caller's JWT, so every read below is filtered by the same RLS
  // the app runs under — a caller can only ever describe their own household.
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await asCaller.auth.getUser();
  if (userError || !userData.user) return json({ error: 'invalid_token' }, 401);

  let payload: { kind?: Kind; entityId?: string; memberId?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }

  const kind = payload.kind;
  if (!kind || !(kind in STRINGS.tr)) return json({ error: 'unknown_kind' }, 400);

  const { data: actor } = await asCaller
    .from('household_members')
    .select('id, name, household_id')
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (!actor) return json({ error: 'not_in_household' }, 403);

  // Resolve what the notification is about from the database rather than from
  // the request, so the text can't be spoofed and can't leak another household.
  let subject = '';
  let amount = '';

  if (kind === 'expense_added') {
    const { data } = await asCaller
      .from('expenses')
      .select('title, total_amount')
      .eq('id', payload.entityId ?? '')
      .eq('household_id', actor.household_id)
      .maybeSingle();
    if (!data) return json({ error: 'entity_not_found' }, 404);
    subject = data.title;
    amount = Number(data.total_amount).toFixed(2);
  } else if (kind === 'item_added' || kind === 'item_purchased') {
    const { data } = await asCaller
      .from('shopping_items')
      .select('name')
      .eq('id', payload.entityId ?? '')
      .eq('household_id', actor.household_id)
      .maybeSingle();
    if (!data) return json({ error: 'entity_not_found' }, 404);
    subject = data.name;
  } else {
    // Settling marks many rows at once and leaves nothing new to read back, so
    // the message names the other person instead of an amount.
    const { data } = await asCaller
      .from('household_members')
      .select('name')
      .eq('id', payload.memberId ?? '')
      .eq('household_id', actor.household_id)
      .maybeSingle();
    if (!data) return json({ error: 'entity_not_found' }, 404);
    subject = data.name;
  }

  // Service role from here: recipients' tokens are deliberately unreadable to
  // any signed-in user, including this caller.
  const asService = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: housemates } = await asService
    .from('household_members')
    .select('user_id')
    .eq('household_id', actor.household_id)
    .neq('user_id', userData.user.id);

  const recipientIds = (housemates ?? []).map((m) => m.user_id).filter(Boolean);
  if (recipientIds.length === 0) return json({ sent: 0 }, 200);

  const { data: tokens } = await asService
    .from('push_tokens')
    .select('token, locale')
    .in('user_id', recipientIds);

  if (!tokens || tokens.length === 0) return json({ sent: 0 }, 200);

  const messages = tokens.map((row) => {
    const strings = STRINGS[row.locale === 'en' ? 'en' : 'tr'];
    const body =
      kind === 'expense_added'
        ? strings.expense_added(actor.name, subject, amount)
        : strings[kind](actor.name, subject);
    return { to: row.token, title: 'Roomly', body, sound: 'default' };
  });

  const stale: string[] = [];
  let sent = 0;

  for (let i = 0; i < messages.length; i += EXPO_BATCH_SIZE) {
    const batch = messages.slice(i, i + EXPO_BATCH_SIZE);
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(batch),
    });

    if (!response.ok) continue;

    const result = await response.json();
    const tickets = Array.isArray(result?.data) ? result.data : [];
    tickets.forEach((ticket: { status?: string; details?: { error?: string } }, index: number) => {
      if (ticket?.status === 'ok') {
        sent += 1;
      } else if (ticket?.details?.error === 'DeviceNotRegistered') {
        stale.push(batch[index].to);
      }
    });
  }

  // A token stays valid until the app is uninstalled or reinstalled; without
  // this, dead devices are retried on every event forever.
  if (stale.length > 0) {
    await asService.from('push_tokens').delete().in('token', stale);
  }

  return json({ sent, removed: stale.length }, 200);
});
