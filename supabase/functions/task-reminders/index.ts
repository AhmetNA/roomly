import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.16';

// Invoked hourly by pg_cron (see the task_due_reminders migration) for every
// server-side reminder. Task due dates are calendar days without a time, so the
// deadline is the end of the due day and both task reminders go out at 18:00
// household time: the day before (push + email) and on the due day itself, six
// hours before the deadline (push only). On a household's rent day, everyone gets
// a 10:00 push with their current debts, computed here so it is never stale.
const TIME_ZONE = 'Europe/Istanbul';
const REMINDER_HOUR = 18;
const RENT_REMINDER_HOUR = 10;
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;

type Kind = 'day_before' | 'six_hours';
type Locale = 'tr' | 'en';

// The notify function's strings can't be shared without a deploy-time module
// layout, so the few needed here are duplicated per locale.
const STRINGS = {
  tr: {
    day_before: (title: string) => `Yarın son gün: ${title}`,
    six_hours: (title: string) => `Son 6 saat: ${title}`,
    emailSubject: 'Roomly: yarın son gün',
    rent: 'Bugün kira günü.',
    youOwe: (list: string) => `Ödemen gerekenler: ${list}.`,
    owedToYou: (list: string) => `Sana ödenecek: ${list}.`,
  },
  en: {
    day_before: (title: string) => `Due tomorrow: ${title}`,
    six_hours: (title: string) => `6 hours left: ${title}`,
    emailSubject: 'Roomly: due tomorrow',
    rent: 'Rent is due today.',
    youOwe: (list: string) => `You owe: ${list}.`,
    owedToYou: (list: string) => `Owed to you: ${list}.`,
  },
} as const;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function localNow(): { date: string; hour: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const secret = req.headers.get('x-cron-secret');
  if (!secret) return json({ error: 'unauthorized' }, 401);

  const asService = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // The secret lives only in Vault: the cron job reads it there and so does this
  // check, so nobody ever has to copy it around.
  const { data: authorized } = await asService.rpc('verify_task_reminders_secret', {
    p_secret: secret,
  });
  if (authorized !== true) return json({ error: 'unauthorized' }, 401);

  const { date: today, hour } = localNow();
  const rent = hour >= RENT_REMINDER_HOUR ? await sendRentReminders(asService, today) : null;
  const tasks = hour >= REMINDER_HOUR ? await sendTaskReminders(asService, today) : null;
  return json({ rent, tasks }, 200);
});

async function sendTaskReminders(asService: SupabaseClient, today: string) {
  const tomorrow = addDays(today, 1);

  const { data: tasks, error } = await asService
    .from('tasks')
    .select('id, title, due_date, task_assignees(member_id)')
    .neq('status', 'done')
    .in('due_date', [today, tomorrow]);
  if (error) return { error: 'query_failed' };

  const candidates = (tasks ?? [])
    .filter((task) => task.task_assignees.length > 0)
    .map((task) => ({
      ...task,
      kind: (task.due_date === tomorrow ? 'day_before' : 'six_hours') as Kind,
    }));
  if (candidates.length === 0) return { checked: 0 };

  // Claim before sending: a failed send loses one reminder, which beats a retry
  // spamming everyone. The due date in the key re-arms reminders after a reschedule.
  const { data: claimed } = await asService
    .from('task_reminders')
    .upsert(
      candidates.map((task) => ({ task_id: task.id, kind: task.kind, due_date: task.due_date })),
      { onConflict: 'task_id,kind,due_date', ignoreDuplicates: true },
    )
    .select('task_id, kind');
  const claimedKeys = new Set((claimed ?? []).map((row) => `${row.task_id}:${row.kind}`));
  const toSend = candidates.filter((task) => claimedKeys.has(`${task.id}:${task.kind}`));
  if (toSend.length === 0) return { checked: candidates.length, claimed: 0 };

  const memberIds = [
    ...new Set(
      toSend.flatMap((task) => task.task_assignees.map((a: { member_id: string }) => a.member_id)),
    ),
  ];
  const { data: members } = await asService
    .from('household_members')
    .select('id, user_id')
    .in('id', memberIds)
    .not('user_id', 'is', null);
  const userByMember = new Map((members ?? []).map((m) => [m.id, m.user_id as string]));

  const tokens = await fetchTokens(asService, [...new Set(userByMember.values())]);
  const localeOf = (userId: string): Locale =>
    tokens.find((row) => row.user_id === userId)?.locale === 'en' ? 'en' : 'tr';

  const messages: { to: string; title: string; body: string; sound: string }[] = [];
  const emails: { userId: string; title: string }[] = [];
  for (const task of toSend) {
    const recipients = new Set(
      task.task_assignees
        .map((a: { member_id: string }) => userByMember.get(a.member_id))
        .filter((id: string | undefined) => !!id),
    ) as Set<string>;
    for (const userId of recipients) {
      for (const row of tokens.filter((token) => token.user_id === userId)) {
        const strings = STRINGS[row.locale === 'en' ? 'en' : 'tr'];
        messages.push({
          to: row.token,
          title: 'Roomly',
          body: strings[task.kind](task.title),
          sound: 'default',
        });
      }
      if (task.kind === 'day_before') emails.push({ userId, title: task.title });
    }
  }

  const sent = await sendPushes(asService, messages);
  const emailed = await sendEmails(asService, emails, localeOf);
  return { checked: candidates.length, claimed: toSend.length, sent, emailed };
}

async function fetchTokens(asService: SupabaseClient, userIds: string[]) {
  if (userIds.length === 0) return [];
  const { data } = await asService
    .from('push_tokens')
    .select('token, locale, user_id')
    .in('user_id', userIds);
  return (data ?? []) as { token: string; locale: string | null; user_id: string }[];
}

async function sendRentReminders(asService: SupabaseClient, today: string) {
  const [year, month, day] = today.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // A rent day past the end of a short month falls on its last day instead.
  const rentDays = day === lastDay ? Array.from({ length: 32 - day }, (_, i) => day + i) : [day];
  const { data: households } = await asService
    .from('households')
    .select('id')
    .in('rent_day', rentDays);
  if (!households || households.length === 0) return { households: 0 };

  const { data: claimed } = await asService
    .from('rent_reminders')
    .upsert(
      households.map((h) => ({ household_id: h.id, rent_date: today })),
      { onConflict: 'household_id,rent_date', ignoreDuplicates: true },
    )
    .select('household_id');
  if (!claimed || claimed.length === 0) return { households: households.length, claimed: 0 };

  const messages: { to: string; title: string; body: string; sound: string }[] = [];
  for (const { household_id: householdId } of claimed) {
    const [{ data: members }, { data: expenses }, { data: settlements }] = await Promise.all([
      asService
        .from('household_members')
        .select('id, name, user_id')
        .eq('household_id', householdId),
      asService
        .from('expenses')
        .select('currency_code, expense_debts(amount, from_member_id, to_member_id, is_settled)')
        .eq('household_id', householdId),
      asService
        .from('settlements')
        .select('amount, currency_code, from_member_id, to_member_id')
        .eq('household_id', householdId),
    ]);
    const nameOf = new Map((members ?? []).map((m) => [m.id, m.name as string]));
    const transfers = simplifyDebts(expenses ?? [], settlements ?? []);
    const recipients = (members ?? []).filter((m) => m.user_id);
    const tokens = await fetchTokens(
      asService,
      recipients.map((m) => m.user_id as string),
    );
    for (const member of recipients) {
      for (const row of tokens.filter((token) => token.user_id === member.user_id)) {
        const locale: Locale = row.locale === 'en' ? 'en' : 'tr';
        const strings = STRINGS[locale];
        const list = (items: Transfer[], other: (t: Transfer) => string) =>
          items.map((t) => `${nameOf.get(other(t)) ?? '?'} ${formatMoney(t, locale)}`).join(', ');
        const owes = transfers.filter((t) => t.from === member.id);
        const owed = transfers.filter((t) => t.to === member.id);
        const body = [
          strings.rent,
          owes.length ? strings.youOwe(list(owes, (t) => t.to)) : '',
          owed.length ? strings.owedToYou(list(owed, (t) => t.from)) : '',
        ]
          .filter(Boolean)
          .join(' ');
        messages.push({ to: row.token, title: 'Roomly', body, sound: 'default' });
      }
    }
  }

  const sent = await sendPushes(asService, messages);
  return { households: households.length, claimed: claimed.length, sent };
}

type Transfer = { from: string; to: string; cents: number; currency: string };
const CURRENCY_SYMBOLS: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€' };

function formatMoney(transfer: Transfer, locale: Locale) {
  const value = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(transfer.cents / 100);
  return `${value} ${CURRENCY_SYMBOLS[transfer.currency] ?? transfer.currency}`;
}

// Mirrors computeSimplifiedTransfers in src/lib/debt.ts so the rent push shows
// exactly what the debt summary screen shows; change both together.
function simplifyDebts(
  expenses: {
    currency_code: string | null;
    expense_debts: {
      amount: number;
      from_member_id: string;
      to_member_id: string;
      is_settled: boolean;
    }[];
  }[],
  settlements: {
    amount: number;
    currency_code: string | null;
    from_member_id: string;
    to_member_id: string;
  }[],
): Transfer[] {
  const nets = new Map<string, Map<string, number>>();
  const add = (currency: string | null, memberId: string, cents: number) => {
    const code = currency && currency in CURRENCY_SYMBOLS ? currency : 'TRY';
    const net = nets.get(code) ?? new Map<string, number>();
    net.set(memberId, (net.get(memberId) ?? 0) + cents);
    nets.set(code, net);
  };
  for (const expense of expenses) {
    for (const debt of expense.expense_debts) {
      if (debt.is_settled) continue;
      const cents = Math.round(debt.amount * 100);
      add(expense.currency_code, debt.from_member_id, -cents);
      add(expense.currency_code, debt.to_member_id, cents);
    }
  }
  for (const settlement of settlements) {
    const cents = Math.round(settlement.amount * 100);
    add(settlement.currency_code, settlement.from_member_id, cents);
    add(settlement.currency_code, settlement.to_member_id, -cents);
  }

  const transfers: Transfer[] = [];
  for (const [currency, net] of nets) {
    const debtors: { id: string; cents: number }[] = [];
    const creditors: { id: string; cents: number }[] = [];
    for (const [id, cents] of net) {
      if (cents < 0) debtors.push({ id, cents: -cents });
      else if (cents > 0) creditors.push({ id, cents });
    }
    debtors.sort((a, b) => b.cents - a.cents || a.id.localeCompare(b.id));
    creditors.sort((a, b) => b.cents - a.cents || a.id.localeCompare(b.id));
    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
      const pay = Math.min(debtors[i].cents, creditors[j].cents);
      if (pay > 0)
        transfers.push({ from: debtors[i].id, to: creditors[j].id, cents: pay, currency });
      debtors[i].cents -= pay;
      creditors[j].cents -= pay;
      if (debtors[i].cents === 0) i += 1;
      if (creditors[j].cents === 0) j += 1;
    }
  }
  return transfers;
}

async function sendPushes(asService: SupabaseClient, messages: { to: string }[]) {
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
      if (ticket?.status === 'ok') sent += 1;
      else if (ticket?.details?.error === 'DeviceNotRegistered') stale.push(batch[index].to);
    });
  }
  // A token stays valid until the app is uninstalled; drop dead ones for good.
  if (stale.length > 0) await asService.from('push_tokens').delete().in('token', stale);
  return sent;
}

// Same Gmail setup as notify: skipped entirely until the secrets exist, and port
// 465 because Edge Functions block outbound 25 and 587.
async function sendEmails(
  asService: SupabaseClient,
  emails: { userId: string; title: string }[],
  localeOf: (userId: string) => Locale,
): Promise<number> {
  const user = Deno.env.get('GMAIL_USER');
  const pass = Deno.env.get('GMAIL_APP_PASSWORD');
  if (!user || !pass || emails.length === 0) return 0;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  const addresses = new Map<string, string | undefined>();
  let emailed = 0;
  for (const { userId, title } of emails) {
    if (!addresses.has(userId)) {
      const { data } = await asService.auth.admin.getUserById(userId);
      addresses.set(userId, data.user?.email);
    }
    const to = addresses.get(userId);
    if (!to) continue;
    const strings = STRINGS[localeOf(userId)];
    try {
      await transporter.sendMail({
        from: `Roomly <${user}>`,
        to,
        subject: strings.emailSubject,
        text: strings.day_before(title),
      });
      emailed += 1;
    } catch (error) {
      console.error('reminder email failed', error instanceof Error ? error.message : error);
    }
  }
  transporter.close();
  return emailed;
}
