import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppSymbol } from '@/components/app-symbol';
import { TaskOptions } from '@/components/task-options';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dateKey, parseDateKey, relativeDate } from '@/lib/tasks';

export function TaskDatePicker({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (date: string | null) => void;
  disabled: boolean;
}) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = value ? parseDateKey(value) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1, 12);
  });
  const firstDay = (month.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const shortcuts = [
    { value: relativeDate(0), label: t('tasks.today') },
    { value: relativeDate(1), label: t('tasks.tomorrow') },
    { value: relativeDate(7), label: t('tasks.nextWeek') },
  ];
  const days = t('tasks.weekdays', { returnObjects: true }) as string[];
  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {t('tasks.dueDate')}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        accessibilityLabel={t('tasks.pickDate')}
        onPress={() => setExpanded(!expanded)}
        style={[styles.selector, { backgroundColor: theme.backgroundElement }]}
      >
        <AppSymbol
          name={{ ios: 'calendar', android: 'calendar_today' }}
          tintColor={theme.accent}
          size={20}
        />
        <ThemedText style={styles.grow}>
          {value
            ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(
                parseDateKey(value),
              )
            : t('tasks.noDate')}
        </ThemedText>
        {value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('tasks.clearDate')}
            disabled={disabled}
            hitSlop={12}
            onPress={() => onChange(null)}
          >
            <AppSymbol
              name={{ ios: 'xmark.circle.fill', android: 'cancel' }}
              tintColor={theme.textSecondary}
              size={18}
            />
          </Pressable>
        ) : (
          <AppSymbol
            name={{
              ios: expanded ? 'chevron.up' : 'chevron.down',
              android: expanded ? 'expand_less' : 'expand_more',
            }}
            tintColor={theme.textSecondary}
            size={16}
          />
        )}
      </Pressable>
      <TaskOptions
        options={shortcuts}
        selected={value ? [value] : []}
        disabled={disabled}
        onSelect={onChange}
      />
      {expanded && (
        <View style={[styles.calendar, { borderColor: theme.border }]}>
          <View style={styles.monthRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('tasks.calendarPrevious')}
              disabled={disabled}
              onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))}
              style={styles.arrow}
            >
              <AppSymbol
                name={{ ios: 'chevron.left', android: 'chevron_left' }}
                tintColor={theme.text}
                size={20}
              />
            </Pressable>
            <ThemedText type="smallBold">
              {new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(
                month,
              )}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('tasks.calendarNext')}
              disabled={disabled}
              onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))}
              style={styles.arrow}
            >
              <AppSymbol
                name={{ ios: 'chevron.right', android: 'chevron_right' }}
                tintColor={theme.text}
                size={20}
              />
            </Pressable>
          </View>
          <View style={styles.grid}>
            {days.map((day) => (
              <View key={day} style={styles.day}>
                <ThemedText type="small" themeColor="textSecondary">
                  {day}
                </ThemedText>
              </View>
            ))}
          </View>
          <View style={styles.grid}>
            {Array.from({ length: Math.ceil((firstDay + count) / 7) * 7 }, (_, i) => {
              const day = i - firstDay + 1;
              if (day < 1 || day > count) return <View key={i} style={styles.day} />;
              const key = dateKey(new Date(month.getFullYear(), month.getMonth(), day, 12));
              const active = key === value;
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityLabel={new Intl.DateTimeFormat(i18n.language, {
                    dateStyle: 'full',
                  }).format(parseDateKey(key))}
                  accessibilityState={{ selected: active }}
                  disabled={disabled}
                  onPress={() => {
                    onChange(key);
                    setExpanded(false);
                  }}
                  style={[
                    styles.day,
                    {
                      backgroundColor: active ? theme.accent : theme.background,
                      borderRadius: Spacing.two,
                    },
                  ]}
                >
                  <ThemedText
                    themeColor={active ? 'onAccent' : key === dateKey() ? 'accent' : 'text'}
                  >
                    {day}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 44,
    borderRadius: Spacing.three,
  },
  grow: { flex: 1 },
  calendar: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    padding: Spacing.two,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: '14.285714%', minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
