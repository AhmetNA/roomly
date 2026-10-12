import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppSymbol } from '@/components/app-symbol';
import { PrimaryButton } from '@/components/primary-button';
import { TaskOptions } from '@/components/task-options';
import { TaskSheet } from '@/components/task-sheet';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTaskCommentsQuery, useTaskMutations } from '@/hooks/use-tasks';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import type { MemberRow } from '@/lib/api/household';
import type { TaskCommentRow, TaskRow } from '@/lib/api/tasks';
import { isTaskOverdue, parseDateKey, type TaskStatus } from '@/lib/tasks';

export function TaskDetailModal({
  task,
  householdId,
  members,
  currentMemberId,
  onClose,
  onEdit,
}: {
  task: TaskRow | undefined;
  householdId: string;
  members: MemberRow[];
  currentMemberId: string | undefined;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const comments = useTaskCommentsQuery(householdId, task?.id);
  const mutations = useTaskMutations(householdId);
  const [body, setBody] = useState('');
  const [editingComment, setEditingComment] = useState<TaskCommentRow | null>(null);
  const name = (id: string) => members.find((m) => m.id === id)?.name ?? t('tasks.unassigned');
  const busy = mutations.status.isPending || mutations.remove.isPending;
  const canNudge =
    !!task &&
    task.status !== 'done' &&
    task.task_assignees.some((a) => a.member_id !== currentMemberId);
  const commentBusy = mutations.comment.isPending || mutations.removeComment.isPending;
  const format = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  async function status(value: TaskStatus) {
    if (!task) return;
    try {
      await mutations.status.mutateAsync({ id: task.id, status: value });
    } catch {
      showAlert(t('tasks.actionError'));
    }
  }
  function remove() {
    if (!task) return;
    showAlert(t('tasks.deleteTitle'), t('tasks.deleteHint'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await mutations.remove.mutateAsync(task.id);
            onClose();
          } catch {
            showAlert(t('tasks.actionError'));
          }
        },
      },
    ]);
  }
  async function comment() {
    if (!task || !currentMemberId || !body.trim()) return;
    try {
      await mutations.comment.mutateAsync({
        id: editingComment?.id,
        taskId: task.id,
        householdId,
        authorId: currentMemberId,
        body,
      });
      setBody('');
      setEditingComment(null);
    } catch {
      /* Keep the unsent text visible. */
    }
  }
  async function nudge() {
    if (!task) return;
    try {
      const result = await mutations.nudge.mutateAsync(task.id);
      if (result.status === 'cooldown') showAlert(t('tasks.nudgeCooldown'));
      else if (result.sent + result.emailed === 0) showAlert(t('tasks.nudgeUnreachable'));
      else showAlert(t('tasks.nudgeSent'));
    } catch {
      showAlert(t('tasks.actionError'));
    }
  }
  function removeComment(id: string) {
    showAlert(t('tasks.deleteCommentTitle'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await mutations.removeComment.mutateAsync(id);
            if (editingComment?.id === id) {
              setEditingComment(null);
              setBody('');
            }
          } catch {
            showAlert(t('tasks.actionError'));
          }
        },
      },
    ]);
  }
  const overdue = !!task && isTaskOverdue(task);
  return (
    <TaskSheet
      title={t('tasks.title')}
      onClose={() => {
        if (!busy && !commentBusy) onClose();
      }}
    >
      {!task ? (
        <ThemedText>{t('tasks.deleted')}</ThemedText>
      ) : (
        <>
          <View style={styles.section}>
            <ThemedText type="subtitle">{task.title}</ThemedText>
            {!!task.description && <ThemedText selectable>{task.description}</ThemedText>}
          </View>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <AppSymbol
                name={{ ios: 'person', android: 'person' }}
                size={14}
                tintColor={theme.textSecondary}
              />
              <ThemedText type="small" themeColor="textSecondary">
                {task.task_assignees.length
                  ? task.task_assignees.map((a) => name(a.member_id)).join(', ')
                  : t('tasks.unassigned')}
              </ThemedText>
            </View>
            {task.due_date && (
              <View style={styles.metaItem}>
                <AppSymbol
                  name={{ ios: 'calendar', android: 'calendar_today' }}
                  size={14}
                  tintColor={overdue ? theme.danger : theme.textSecondary}
                />
                <ThemedText type="small" themeColor={overdue ? 'danger' : 'textSecondary'}>
                  {new Intl.DateTimeFormat(i18n.language, {
                    day: 'numeric',
                    month: 'short',
                  }).format(parseDateKey(task.due_date))}
                  {overdue ? ` · ${t('tasks.overdue')}` : ''}
                </ThemedText>
              </View>
            )}
            {task.priority !== 'normal' && (
              <View style={styles.metaItem}>
                <AppSymbol
                  name={{ ios: 'flag', android: 'flag' }}
                  size={14}
                  tintColor={task.priority === 'high' ? theme.danger : theme.textSecondary}
                />
                <ThemedText
                  type="small"
                  themeColor={task.priority === 'high' ? 'danger' : 'textSecondary'}
                >
                  {t(`tasks.priorities.${task.priority}`)}
                </ThemedText>
              </View>
            )}
          </View>
          <TaskOptions
            options={(['todo', 'in_progress', 'done'] as const).map((s) => ({
              value: s,
              label: t(`tasks.statuses.${s}`),
            }))}
            selected={[task.status]}
            disabled={busy}
            onSelect={(s) => {
              if (s !== task.status) void status(s as TaskStatus);
            }}
          />
          <View style={styles.actions}>
            <View style={styles.grow}>
              <PrimaryButton
                variant="secondary"
                label={t('tasks.edit')}
                onPress={onEdit}
                disabled={busy || commentBusy}
                icon={{ ios: 'pencil', android: 'edit' }}
              />
            </View>
            {canNudge && (
              <View style={styles.grow}>
                <PrimaryButton
                  variant="secondary"
                  label={mutations.nudge.isPending ? t('tasks.nudging') : t('tasks.nudge')}
                  onPress={nudge}
                  disabled={busy || mutations.nudge.isPending}
                  icon={{ ios: 'bell', android: 'notifications' }}
                />
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.delete')}
              disabled={busy || commentBusy}
              onPress={remove}
              style={[styles.delete, { backgroundColor: theme.backgroundElement }]}
            >
              <AppSymbol
                name={{ ios: 'trash', android: 'delete' }}
                size={20}
                tintColor={theme.danger}
              />
            </Pressable>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {task.completed_by && task.completed_at
              ? `${t('tasks.completedBy', { name: name(task.completed_by) })} · ${format.format(new Date(task.completed_at))}`
              : `${t('tasks.createdBy', { name: name(task.created_by) })} · ${format.format(new Date(task.created_at))}`}
          </ThemedText>
          <View style={[styles.comments, { borderColor: theme.border }]}>
            {comments.isLoading && <ActivityIndicator color={theme.accent} />}
            {comments.isError && (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void comments.refetch();
                }}
              >
                <ThemedText themeColor="danger" type="small">
                  {t('tasks.commentsError')} {t('common.retry')}
                </ThemedText>
              </Pressable>
            )}
            {comments.data?.map((c) => (
              <View
                key={c.id}
                style={[styles.comment, { backgroundColor: theme.backgroundElement }]}
              >
                <View style={styles.commentHeader}>
                  <ThemedText type="smallBold">{name(c.author_id)}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.grow}>
                    {format.format(new Date(c.created_at))}
                    {c.updated_at !== c.created_at ? ` · ${t('tasks.edited')}` : ''}
                  </ThemedText>
                  {c.author_id === currentMemberId && (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('tasks.editComment')}
                        disabled={commentBusy}
                        onPress={() => {
                          setEditingComment(c);
                          setBody(c.body);
                        }}
                        style={styles.icon}
                      >
                        <AppSymbol
                          name={{ ios: 'pencil', android: 'edit' }}
                          size={15}
                          tintColor={theme.textSecondary}
                        />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('tasks.deleteComment')}
                        disabled={commentBusy}
                        onPress={() => removeComment(c.id)}
                        style={styles.icon}
                      >
                        <AppSymbol
                          name={{ ios: 'trash', android: 'delete' }}
                          size={15}
                          tintColor={theme.danger}
                        />
                      </Pressable>
                    </>
                  )}
                </View>
                <ThemedText selectable>{c.body}</ThemedText>
              </View>
            ))}
            {mutations.comment.isError && (
              <ThemedText accessibilityRole="alert" type="small" themeColor="danger">
                {t('tasks.actionError')}
              </ThemedText>
            )}
            <View style={styles.composer}>
              <TextInput
                accessibilityLabel={t(
                  editingComment ? 'tasks.editComment' : 'tasks.commentPlaceholder',
                )}
                placeholder={t('tasks.commentPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                value={body}
                onChangeText={setBody}
                multiline
                maxLength={2000}
                editable={!commentBusy && !!currentMemberId}
                style={[
                  styles.commentInput,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
              />
              {editingComment && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.cancel')}
                  disabled={commentBusy}
                  onPress={() => {
                    setEditingComment(null);
                    setBody('');
                  }}
                  style={styles.icon}
                >
                  <AppSymbol
                    name={{ ios: 'xmark', android: 'close' }}
                    size={18}
                    tintColor={theme.textSecondary}
                  />
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(editingComment ? 'common.save' : 'tasks.sendComment')}
                disabled={!body.trim() || !currentMemberId || commentBusy}
                onPress={comment}
                style={[
                  styles.send,
                  {
                    backgroundColor: theme.accent,
                    opacity: !body.trim() || commentBusy ? 0.4 : 1,
                  },
                ]}
              >
                {commentBusy ? (
                  <ActivityIndicator color={theme.onAccent} />
                ) : (
                  <AppSymbol
                    name={{
                      ios: editingComment ? 'checkmark' : 'arrow.up',
                      android: editingComment ? 'check' : 'send',
                    }}
                    size={18}
                    tintColor={theme.onAccent}
                  />
                )}
              </Pressable>
            </View>
          </View>
        </>
      )}
    </TaskSheet>
  );
}
const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  meta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.three, rowGap: Spacing.one },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  grow: { flex: 1, minWidth: 0 },
  delete: {
    width: 52,
    height: 52,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comments: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  comment: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  icon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    fontSize: 16,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
