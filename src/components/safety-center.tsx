import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { PolicyLinks } from '@/components/policy-links';
import { PrimaryButton } from '@/components/primary-button';
import { TaskOptions } from '@/components/task-options';
import { TaskSheet } from '@/components/task-sheet';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useMembersQuery } from '@/hooks/use-household';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import {
  fetchBlocks,
  fetchReportTargets,
  reportContent,
  reportKinds,
  setUserBlock,
  type ReportKind,
} from '@/lib/api/safety';

export function SafetyCenterButton({ householdId }: { householdId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <PrimaryButton label={t('safety.title')} variant="secondary" onPress={() => setOpen(true)} />
      {open && <SafetyCenter householdId={householdId} onClose={() => setOpen(false)} />}
    </>
  );
}
function SafetyCenter({ householdId, onClose }: { householdId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const session = useSession();
  const client = useQueryClient();
  const [kind, setKind] = useState<ReportKind>('member');
  const [target, setTarget] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const targets = useQuery({
    queryKey: ['report-targets', householdId, kind],
    queryFn: () => fetchReportTargets(kind, householdId),
  });
  const blocks = useQuery({ queryKey: ['blocks', session?.user.id], queryFn: fetchBlocks });
  const { data: members = [] } = useMembersQuery(householdId);
  async function submit() {
    if (!target || busy) return;
    setBusy(true);
    try {
      await reportContent(kind, target, reason);
      setReason('');
      setTarget(null);
      showAlert(t('safety.reportSent'));
    } catch {
      showAlert(t('safety.error'));
    } finally {
      setBusy(false);
    }
  }
  async function block(userId: string, blocked: boolean) {
    setBusy(true);
    try {
      await setUserBlock(userId, blocked);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['blocks'] }),
        client.invalidateQueries({ queryKey: ['task_comments'] }),
      ]);
    } catch {
      showAlert(t('safety.error'));
    } finally {
      setBusy(false);
    }
  }
  const blockIds = blocks.data ?? [];
  const blockTargets = [
    ...new Set([
      ...members
        .map((m) => m.user_id)
        .filter((id): id is string => !!id && id !== session?.user.id),
      ...blockIds,
    ]),
  ];
  return (
    <TaskSheet
      title={t('safety.title')}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <ThemedText type="subtitle">{t('safety.report')}</ThemedText>
      <TaskOptions
        options={reportKinds.map((value) => ({ value, label: t(`safety.kinds.${value}`) }))}
        selected={[kind]}
        disabled={busy}
        onSelect={(value) => {
          setKind(value as ReportKind);
          setTarget(null);
        }}
      />
      <ThemedText type="small" themeColor="textSecondary">
        {t('safety.selectTarget')}
      </ThemedText>
      {(targets.isPending || targets.isError) && (
        <PrimaryButton
          variant="secondary"
          label={t(targets.isError ? 'common.retry' : 'safety.loading')}
          onPress={() => void targets.refetch()}
          disabled={targets.isPending}
        />
      )}
      {targets.data?.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="radio"
          accessibilityState={{ checked: target === item.id }}
          disabled={busy}
          onPress={() => setTarget(item.id)}
          style={[styles.target, { borderColor: target === item.id ? theme.accent : theme.border }]}
        >
          <ThemedText type="small" numberOfLines={2}>
            {item.label}
          </ThemedText>
        </Pressable>
      ))}
      {targets.data?.length === 0 && <ThemedText type="small">{t('safety.noTargets')}</ThemedText>}
      <TextField
        label={t('safety.reason')}
        value={reason}
        onChangeText={setReason}
        maxLength={2000}
        multiline
        editable={!busy}
      />
      <PrimaryButton
        label={t('safety.send')}
        onPress={() => void submit()}
        disabled={busy || !target || reason.trim().length < 3}
      />
      <ThemedText type="small" themeColor="textSecondary">
        {t('safety.reportHint')}
      </ThemedText>
      <ThemedText type="subtitle">{t('safety.blockTitle')}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {t('safety.blockHint')}
      </ThemedText>
      {blocks.isError && (
        <PrimaryButton
          label={t('common.retry')}
          variant="secondary"
          onPress={() => void blocks.refetch()}
        />
      )}
      {blockTargets.map((id) => (
        <View key={id} style={styles.blockRow}>
          <ThemedText style={styles.grow}>
            {members.find((m) => m.user_id === id)?.name ?? t('safety.formerMember')}
          </ThemedText>
          <PrimaryButton
            label={t(blockIds.includes(id) ? 'safety.unblock' : 'safety.block')}
            variant="secondary"
            disabled={busy || !blocks.isSuccess}
            onPress={() => void block(id, !blockIds.includes(id))}
          />
        </View>
      ))}
      <PolicyLinks />
    </TaskSheet>
  );
}
const styles = StyleSheet.create({
  target: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.three },
  blockRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  grow: { flex: 1 },
});
