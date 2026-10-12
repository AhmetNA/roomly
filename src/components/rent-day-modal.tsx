import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { TaskSheet } from '@/components/task-sheet';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useUpdateRentDayMutation } from '@/hooks/use-household';
import { useTheme } from '@/hooks/use-theme';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function RentDayModal({
  householdId,
  rentDay,
  onClose,
}: {
  householdId: string;
  rentDay: number | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const mutation = useUpdateRentDayMutation(householdId);

  async function select(day: number | null) {
    try {
      await mutation.mutateAsync(day);
      onClose();
    } catch {
      /* The error message below stays visible next to the picker. */
    }
  }

  return (
    <TaskSheet
      title={t('people.rentDayTitle')}
      onClose={() => {
        if (!mutation.isPending) onClose();
      }}
    >
      <ThemedText type="small" themeColor="textSecondary">
        {t('people.rentDayHint')}
      </ThemedText>
      <View style={styles.grid}>
        {DAYS.map((day) => {
          const active = day === rentDay;
          return (
            <View key={day} style={styles.cell}>
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel={t('people.rentDayValue', { day })}
                accessibilityState={{ checked: active, disabled: mutation.isPending }}
                disabled={mutation.isPending}
                onPress={() => {
                  void select(day);
                }}
                style={[
                  styles.day,
                  { backgroundColor: active ? theme.accent : theme.backgroundElement },
                ]}
              >
                <ThemedText type="smallBold" themeColor={active ? 'onAccent' : 'text'}>
                  {day}
                </ThemedText>
              </Pressable>
            </View>
          );
        })}
      </View>
      {mutation.isError && (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {t('people.rentDayError')}
        </ThemedText>
      )}
      {rentDay !== null && (
        <PrimaryButton
          variant="secondary"
          label={t('people.rentDayClear')}
          disabled={mutation.isPending}
          onPress={() => {
            void select(null);
          }}
          icon={{ ios: 'bell.slash', android: 'notifications_off' }}
        />
      )}
    </TaskSheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.285714%', padding: Spacing.half },
  day: {
    aspectRatio: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.two,
  },
});
