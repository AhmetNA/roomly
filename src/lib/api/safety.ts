import { supabase } from '@/lib/supabase';

export const TERMS_VERSION = '2026-10-23';
export const termsKey = (userId: string | undefined) => ['terms', userId] as const;
export async function hasAcceptedTerms(userId: string) {
  const { data, error } = await supabase
    .from('terms_acceptances')
    .select('version')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.version === TERMS_VERSION;
}
export async function acceptTerms() {
  const { error } = await supabase.rpc('accept_current_terms');
  if (error) throw error;
}
export const reportKinds = [
  'member',
  'expense',
  'shopping_item',
  'task',
  'comment',
  'category',
  'household',
] as const;
export type ReportKind = (typeof reportKinds)[number];
export async function fetchReportTargets(kind: ReportKind, householdId: string) {
  const table = {
    member: 'household_members',
    expense: 'expenses',
    shopping_item: 'shopping_items',
    task: 'tasks',
    comment: 'task_comments',
    category: 'categories',
    household: 'households',
  } as const;
  const { data, error } =
    kind === 'household'
      ? await supabase.from('households').select('*').eq('id', householdId).limit(1)
      : await supabase
          .from(table[kind])
          .select('*')
          .eq('household_id', householdId)
          .order('created_at', { ascending: false })
          .limit(100);
  if (error) throw error;
  return (data as unknown as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    label: String(row.title ?? row.name ?? row.body ?? ''),
  }));
}
export async function reportContent(kind: ReportKind, targetId: string, reason: string) {
  const { error } = await supabase.rpc('report_content', {
    p_kind: kind,
    p_target_id: targetId,
    p_reason: reason.trim(),
  });
  if (error) throw error;
}
export async function fetchBlocks() {
  const { data, error } = await supabase.from('user_blocks').select('blocked_user_id');
  if (error) throw error;
  return data.map((row) => row.blocked_user_id);
}
export async function setUserBlock(userId: string, blocked: boolean) {
  const { error } = await supabase.rpc('set_user_block', { p_user_id: userId, p_blocked: blocked });
  if (error) throw error;
}
