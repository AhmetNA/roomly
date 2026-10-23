import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

export const accountDeletionKey = (userId: string | undefined) =>
  ['account-deletion', userId] as const;

export async function isAccountDeletionPending(userId: string) {
  const { data, error } = await supabase
    .from('account_deletions')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function deleteMyAccount(): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: { confirmation: 'DELETE' },
  });
  if (error || data?.deleted !== true) {
    // Preparation may already have removed membership before a storage failure.
    // A lost success response can leave a token for an account the server already
    // deleted. Discard that invalid session without claiming the deletion succeeded.
    const { error: authError } = await supabase.auth.getUser();
    if (authError && [401, 403, 404].includes(authError.status ?? 0)) {
      await supabase.auth.signOut({ scope: 'local' });
      queryClient.clear();
    } else {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['account-deletion'] }),
        queryClient.invalidateQueries({ queryKey: ['household'] }),
      ]);
    }
    if (error) throw error;
    return false;
  }
  // The server revoked every session. Discard this device's persisted copy too.
  await supabase.auth.signOut({ scope: 'local' });
  queryClient.clear();
  return true;
}
