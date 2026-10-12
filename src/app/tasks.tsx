import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppSymbol } from '@/components/app-symbol';
import { EmptyState } from '@/components/empty-state';
import { FloatingActionButton } from '@/components/floating-action-button';
import { SearchBar, SearchButton } from '@/components/header-search';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { TaskDetailModal } from '@/components/task-detail-modal';
import { TaskEditorModal } from '@/components/task-editor-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useHouseholdQuery, useMembersQuery, useHouseholdRealtime } from '@/hooks/use-household';
import { usePullRefresh } from '@/hooks/use-pull-refresh';
import { useSession } from '@/hooks/use-session';
import { useTaskMutations, useTasksQuery, useTasksRealtime } from '@/hooks/use-tasks';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import type { TaskRow } from '@/lib/api/tasks';
import { dateKey, filterTasks, isTaskOverdue, parseDateKey, type TaskFilter } from '@/lib/tasks';

type ModalState = { kind: 'create' } | { kind: 'detail' | 'edit'; id: string } | null;
const FILTERS: TaskFilter[] = ['open', 'mine', 'overdue', 'done', 'all'];

export default function TasksScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const session = useSession();
  const household = useHouseholdQuery();
  const householdId = household.data?.id;
  const membersQuery = useMembersQuery(householdId);
  const members = membersQuery.data ?? [];
  const tasksQuery = useTasksQuery(householdId);
  const tasks = tasksQuery.data ?? [];
  useTasksRealtime(householdId);
  useHouseholdRealtime(householdId);
  const mutations = useTaskMutations(householdId);
  const [filter, setFilter] = useState<TaskFilter>('open');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  function closeSearch() {
    setSearchOpen(false);
    setSearch('');
  }
  const [modal, setModal] = useState<ModalState>(null);
  const [today, setToday] = useState(dateKey());
  useEffect(() => {
    const timer = setInterval(() => setToday(dateKey()), 60000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setToday(dateKey());
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
  const currentMemberId = members.find((m) => m.user_id === session?.user.id)?.id;
  const visibleTasks = filterTasks(tasks, filter, currentMemberId, search, today);
  const selectedTask =
    modal && modal.kind !== 'create' ? tasks.find((task) => task.id === modal.id) : undefined;
  const done = tasks.filter((task) => task.status === 'done').length;
  const { refreshing, onRefresh } = usePullRefresh([
    household.refetch,
    membersQuery.refetch,
    tasksQuery.refetch,
  ]);
  const name = (id: string) => members.find((m) => m.id === id)?.name ?? t('tasks.unassigned');
  async function toggle(task: TaskRow) {
    try {
      await mutations.status.mutateAsync({
        id: task.id,
        status: task.status === 'done' ? 'todo' : 'done',
      });
    } catch {
      showAlert(t('tasks.actionError'));
    }
  }
  function renderTask({ item: task }: { item: TaskRow }) {
    const completed = task.status === 'done';
    const overdue = isTaskOverdue(task, today);
    return (
      <View style={[styles.task, { borderColor: theme.border }]}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={t(completed ? 'tasks.reopen' : 'tasks.complete') + ': ' + task.title}
          accessibilityState={{ checked: completed, disabled: mutations.status.isPending }}
          disabled={mutations.status.isPending}
          onPress={() => {
            void toggle(task);
          }}
          style={styles.check}
        >
          <AppSymbol
            name={{
              ios: completed ? 'checkmark.circle.fill' : 'circle',
              android: completed ? 'check_circle' : 'radio_button_unchecked',
            }}
            tintColor={completed ? theme.success : theme.textSecondary}
            size={26}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={task.title}
          onPress={() => setModal({ kind: 'detail', id: task.id })}
          style={styles.taskContent}
        >
          <ThemedText
            type="default"
            style={completed ? styles.completed : undefined}
            themeColor={completed ? 'textSecondary' : 'text'}
          >
            {task.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {task.task_assignees.length
              ? task.task_assignees.map((a) => name(a.member_id)).join(', ')
              : t('tasks.unassigned')}
          </ThemedText>
          <View style={styles.metadata}>
            {task.due_date && (
              <ThemedText type="small" themeColor={overdue ? 'danger' : 'textSecondary'}>
                {new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(
                  parseDateKey(task.due_date),
                )}
                {overdue ? ` · ${t('tasks.overdue')}` : ''}
              </ThemedText>
            )}
            {task.priority !== 'normal' && (
              <ThemedText
                type="small"
                themeColor={task.priority === 'high' ? 'danger' : 'textSecondary'}
              >
                {t(`tasks.priorities.${task.priority}`)}
              </ThemedText>
            )}
            {task.status === 'in_progress' && (
              <ThemedText type="small" themeColor="accent">
                {t('tasks.statuses.in_progress')}
              </ThemedText>
            )}
          </View>
        </Pressable>
        <AppSymbol
          name={{ ios: 'chevron.right', android: 'chevron_right' }}
          size={16}
          tintColor={theme.textSecondary}
        />
      </View>
    );
  }
  const loading = tasksQuery.isLoading || membersQuery.isLoading;
  const error = tasksQuery.isError || membersQuery.isError;
  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView edges={['top']} style={styles.fill}>
        <View style={styles.frame}>
          <ScreenHeader
            title={t('tasks.title')}
            refreshing={refreshing}
            onRefresh={onRefresh}
            actions={
              <SearchButton
                active={searchOpen}
                onPress={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
              />
            }
          />
          {searchOpen ? (
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={t('tasks.search')}
              onClose={closeSearch}
            />
          ) : null}
          {tasks.length > 0 && (
            <View style={styles.summary}>
              <ThemedText type="smallBold">
                {t('tasks.progress', { done, total: tasks.length })}
              </ThemedText>
              <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
                <View
                  style={[
                    styles.progress,
                    { backgroundColor: theme.success, width: `${(done / tasks.length) * 100}%` },
                  ]}
                />
              </View>
            </View>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filters}
            contentContainerStyle={styles.filterContent}
          >
            {FILTERS.map((f) => (
              <Pressable
                key={f}
                accessibilityRole="tab"
                accessibilityState={{ selected: f === filter }}
                onPress={() => setFilter(f)}
                hitSlop={4}
                style={[
                  styles.filter,
                  { backgroundColor: f === filter ? theme.accent : theme.backgroundElement },
                ]}
              >
                <ThemedText type="smallBold" themeColor={f === filter ? 'onAccent' : 'text'}>
                  {t(`tasks.filters.${f}`)}{' '}
                  {filterTasks(tasks, f, currentMemberId, '', today).length}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <ThemedText style={styles.error} themeColor="textSecondary">
                {t('tasks.loadError')}
              </ThemedText>
              <PrimaryButton label={t('common.retry')} onPress={onRefresh} />
            </View>
          ) : (
            <FlatList
              data={visibleTasks}
              renderItem={renderTask}
              keyExtractor={(task) => task.id}
              contentContainerStyle={[styles.list, visibleTasks.length === 0 && styles.fill]}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.accent}
                />
              }
              ListEmptyComponent={
                <EmptyState
                  icon={{ ios: 'checklist', android: 'checklist' }}
                  title={t(tasks.length ? 'tasks.noResults' : 'tasks.empty')}
                />
              }
            />
          )}
          {!!householdId && !membersQuery.isError && !membersQuery.isLoading && (
            <FloatingActionButton
              onPress={() => setModal({ kind: 'create' })}
              accessibilityLabel={t('tasks.add')}
            />
          )}
        </View>
      </SafeAreaView>
      {!!householdId && (modal?.kind === 'detail' || (modal?.kind === 'edit' && !selectedTask)) && (
        <TaskDetailModal
          key={modal.id}
          task={selectedTask}
          householdId={householdId}
          members={members}
          currentMemberId={currentMemberId}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ kind: 'edit', id: modal.id })}
        />
      )}
      {!!householdId &&
        (modal?.kind === 'create' || (modal?.kind === 'edit' && !!selectedTask)) && (
          <TaskEditorModal
            key={modal.kind === 'edit' ? modal.id : 'new'}
            task={selectedTask}
            householdId={householdId}
            members={members}
            onClose={() =>
              setModal(modal.kind === 'edit' ? { kind: 'detail', id: modal.id } : null)
            }
            onSaved={(id) => setModal({ kind: 'detail', id })}
          />
        )}
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  frame: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  summary: { paddingHorizontal: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.three },
  track: { height: 4, borderRadius: Spacing.one, overflow: 'hidden' },
  progress: { height: '100%' },
  filters: { flexGrow: 0 },
  filterContent: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.two, gap: Spacing.two },
  filter: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: Spacing.three,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  error: { textAlign: 'center' },
  list: { paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + 96 },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  check: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  taskContent: { flex: 1, gap: Spacing.one, minWidth: 0 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  completed: { textDecorationLine: 'line-through' },
});
