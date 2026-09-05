import * as Clipboard from 'expo-clipboard';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useHouseholdStore } from '@/lib/store';
import type { Member } from '@/types/household';

export default function PeopleScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const household = useHouseholdStore((state) => state.household);
  const members = useHouseholdStore((state) => state.members);
  const currentMemberId = useHouseholdStore((state) => state.currentMemberId);
  const updateMember = useHouseholdStore((state) => state.updateMember);
  const leaveHousehold = useHouseholdStore((state) => state.leaveHousehold);

  const [editingMember, setEditingMember] = useState<Member | null>(null);

  async function copyToClipboard(value: string, message: string) {
    await Clipboard.setStringAsync(value);
    Alert.alert(message);
  }

  function handleLeave() {
    Alert.alert(t('people.logout'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('people.logout'), style: 'destructive', onPress: leaveHousehold },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScreenHeader title={t('people.title')} />
        <FlatList
          data={members}
          keyExtractor={(member) => member.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelf = item.id === currentMemberId;
            return (
              <ThemedView type="backgroundElement" style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  <ThemedText type="default" style={styles.memberName}>
                    {item.name} {isSelf ? t('people.you') : ''}
                  </ThemedText>
                  {item.iban ? (
                    <Pressable
                      onPress={() => copyToClipboard(item.iban ?? '', t('people.ibanCopied'))}
                      style={styles.ibanRow}
                    >
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.iban}
                      </ThemedText>
                      <SymbolView name="doc.on.doc" size={13} tintColor={theme.textSecondary} />
                    </Pressable>
                  ) : (
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('people.ibanMissing')}
                    </ThemedText>
                  )}
                </View>
                {isSelf && (
                  <Pressable onPress={() => setEditingMember(item)} hitSlop={12}>
                    <ThemedText type="link" themeColor="accent">
                      {t('people.edit')}
                    </ThemedText>
                  </Pressable>
                )}
              </ThemedView>
            );
          }}
          ListFooterComponent={
            household ? (
              <ThemedView type="backgroundElement" style={styles.householdCard}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {t('people.householdSection').toUpperCase()}
                </ThemedText>
                <ThemedText type="default" style={styles.householdName}>
                  {household.name}
                </ThemedText>
                <Pressable
                  onPress={() =>
                    copyToClipboard(household.inviteCode, t('people.inviteCodeCopied'))
                  }
                  style={styles.ibanRow}
                >
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('people.inviteCode')}: {household.inviteCode}
                  </ThemedText>
                  <SymbolView name="doc.on.doc" size={13} tintColor={theme.textSecondary} />
                </Pressable>
                <Pressable onPress={handleLeave} style={styles.leaveButton}>
                  <ThemedText type="small" themeColor="danger">
                    {t('people.logout')}
                  </ThemedText>
                </Pressable>
              </ThemedView>
            ) : null
          }
        />
      </SafeAreaView>

      <EditMemberModal
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onSave={(updates) => {
          if (editingMember) updateMember(editingMember.id, updates);
          setEditingMember(null);
        }}
      />
    </ThemedView>
  );
}

function EditMemberModal({
  member,
  onClose,
  onSave,
}: {
  member: Member | null;
  onClose: () => void;
  onSave: (updates: { name: string; iban: string | null }) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(member?.name ?? '');
  const [iban, setIban] = useState(member?.iban ?? '');

  return (
    <Modal
      visible={member !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={() => {
        setName(member?.name ?? '');
        setIban(member?.iban ?? '');
      }}
    >
      <ThemedView style={styles.modalContainer}>
        <SafeAreaView style={styles.safeArea}>
          <ScreenHeader title={t('people.editTitle')} />
          <ThemedView style={styles.modalForm}>
            <TextField
              label={t('people.nameLabel')}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <TextField
              label={t('people.ibanLabel')}
              value={iban}
              onChangeText={setIban}
              placeholder={t('people.ibanPlaceholder')}
              autoCapitalize="characters"
            />
            <PrimaryButton
              label={t('common.save')}
              disabled={name.trim().length === 0}
              onPress={() => onSave({ name: name.trim(), iban: iban.trim() || null })}
            />
            <PrimaryButton label={t('common.cancel')} variant="secondary" onPress={onClose} />
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  memberInfo: {
    gap: Spacing.half,
  },
  memberName: {
    fontWeight: '600',
  },
  ibanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  householdCard: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  householdName: {
    fontWeight: '600',
  },
  leaveButton: {
    marginTop: Spacing.two,
  },
  modalContainer: {
    flex: 1,
  },
  modalForm: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
});
