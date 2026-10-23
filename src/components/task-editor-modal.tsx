import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { TaskDatePicker } from '@/components/task-date-picker';
import { TaskOptions } from '@/components/task-options';
import { TaskSheet } from '@/components/task-sheet';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTaskMutations } from '@/hooks/use-tasks';
import type { MemberRow } from '@/lib/api/household';
import type { TaskRow } from '@/lib/api/tasks';
import type { TaskPriority, TaskStatus } from '@/lib/tasks';

export function TaskEditorModal({
  task,
  householdId,
  members,
  onClose,
  onSaved,
}: {
  task?: TaskRow;
  householdId: string;
  members: MemberRow[];
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [assigneeIds, setAssigneeIds] = useState(
    task?.task_assignees.map((a) => a.member_id) ?? [],
  );
  const [dueDate, setDueDate] = useState(task?.due_date ?? null);
  const [priority, setPriority] = useState<TaskPriority>(
    (task?.priority as TaskPriority) ?? 'normal',
  );
  const [status, setStatus] = useState<TaskStatus>((task?.status as TaskStatus) ?? 'todo');
  const mutations = useTaskMutations(householdId);
  const busy = mutations.save.isPending;
  async function save() {
    try {
      const id = await mutations.save.mutateAsync({
        id: task?.id,
        title,
        description,
        assigneeIds,
        dueDate,
        priority,
        status,
      });
      onSaved(id);
    } catch {
      /* Error stays beside the save action, with the draft intact. */
    }
  }
  return (
    <TaskSheet
      title={t(task ? 'tasks.edit' : 'tasks.add')}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <TextField
        label={t('tasks.titleLabel')}
        accessibilityLabel={t('tasks.titleLabel')}
        placeholder={t('tasks.titlePlaceholder')}
        value={title}
        onChangeText={setTitle}
        editable={!busy}
        maxLength={160}
        autoCapitalize="sentences"
      />
      <TextField
        label={t('tasks.description')}
        accessibilityLabel={t('tasks.description')}
        placeholder={t('tasks.descriptionPlaceholder')}
        value={description}
        onChangeText={setDescription}
        editable={!busy}
        maxLength={4000}
        multiline
        textAlignVertical="top"
        style={styles.description}
      />
      <View style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('tasks.assignees')}
        </ThemedText>
        <TaskOptions
          multiple
          options={members
            .filter((m) => !m.account_deleted_at)
            .map((m) => ({ value: m.id, label: m.name }))}
          selected={assigneeIds}
          disabled={busy}
          onSelect={(id) =>
            setAssigneeIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]))
          }
        />
      </View>
      <TaskDatePicker value={dueDate} onChange={setDueDate} disabled={busy} />
      <View style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('tasks.priority')}
        </ThemedText>
        <TaskOptions
          options={(['low', 'normal', 'high'] as const).map((p) => ({
            value: p,
            label: t(`tasks.priorities.${p}`),
          }))}
          selected={[priority]}
          onSelect={(p) => setPriority(p as TaskPriority)}
          disabled={busy}
        />
      </View>
      {/* New tasks always start as to-do; status only matters once a task exists. */}
      {task && (
        <View style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            {t('tasks.status')}
          </ThemedText>
          <TaskOptions
            options={(['todo', 'in_progress', 'done'] as const).map((s) => ({
              value: s,
              label: t(`tasks.statuses.${s}`),
            }))}
            selected={[status]}
            onSelect={(s) => setStatus(s as TaskStatus)}
            disabled={busy}
          />
        </View>
      )}
      {mutations.save.isError && (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {t('tasks.saveError')}
        </ThemedText>
      )}
      <PrimaryButton
        label={busy ? t('tasks.saving') : t('common.save')}
        disabled={busy || !title.trim()}
        onPress={save}
        icon={{ ios: 'checkmark', android: 'check' }}
      />
    </TaskSheet>
  );
}
const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  description: { minHeight: 64 },
});
