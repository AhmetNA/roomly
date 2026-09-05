import * as Clipboard from 'expo-clipboard';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  useHouseholdQuery,
  useHouseholdRealtime,
  useLeaveHouseholdMutation,
  useMembersQuery,
  useUpdateMemberMutation,
} from '@/hooks/use-household';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { getAuthErrorMessageKey, signOut } from '@/lib/api/auth';
import type { MemberRow } from '@/lib/api/household';
import { isValidIban } from '@/lib/iban';

export default function PeopleScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const session = useSession();

  const { data: household } = useHouseholdQuery();
  const { data: members = [], isLoading } = useMembersQuery(household?.id);
  const updateMember = useUpdateMemberMutation(household?.id);
  const leaveHousehold = useLeaveHouseholdMutation();
  useHouseholdRealtime(household?.id);

  const currentUserId = session?.user.id;
  const [editingMember, setEditingMember] = useState<MemberRow | null>(null);

  async function copyToClipboard(value: string, message: string) {
    await Clipboard.setStringAsync(value);
    Alert.alert(message);
  }

  function handleLeaveHousehold() {
    Alert.alert(t('people.leaveHousehold'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('people.leaveHousehold'),
        style: 'destructive',
        onPress: () => leaveHousehold.mutate(),
      },
    ]);
  }

  function handleSignOut() {
    Alert.alert(t('people.signOut'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('people.signOut'), style: 'destructive', onPress: () => signOut() },
    ]);
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.centered]} edges={['top']}>
          <ActivityIndicator color={theme.accent} />
        </SafeAreaView>
      </ThemedView>
    );
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
            const isSelf = item.user_id === currentUserId;
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
                      <SymbolView
                        name={{ ios: 'doc.on.doc', android: 'content_copy' }}
                        size={13}
                        tintColor={theme.textSecondary}
                      />
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
                    copyToClipboard(household.invite_code, t('people.inviteCodeCopied'))
                  }
                  style={styles.ibanRow}
                >
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('people.inviteCode')}: {household.invite_code}
                  </ThemedText>
                  <SymbolView
                    name={{ ios: 'doc.on.doc', android: 'content_copy' }}
                    size={13}
                    tintColor={theme.textSecondary}
                  />
                </Pressable>
                <Pressable onPress={handleLeaveHousehold} style={styles.leaveButton}>
                  <ThemedText type="small" themeColor="danger">
                    {t('people.leaveHousehold')}
                  </ThemedText>
                </Pressable>
                <Pressable onPress={handleSignOut} style={styles.leaveButton}>
                  <ThemedText type="small" themeColor="danger">
                    {t('people.signOut')}
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
        onSave={async (updates) => {
          if (!editingMember) return;
          try {
            await updateMember.mutateAsync({ memberId: editingMember.id, updates });
            setEditingMember(null);
          } catch (error) {
            Alert.alert(t(getAuthErrorMessageKey(error)));
          }
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
  member: MemberRow | null;
  onClose: () => void;
  onSave: (updates: { name: string; iban: string | null }) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(member?.name ?? '');
  const [iban, setIban] = useState(member?.iban ?? '');

  const trimmedIban = iban.trim();
  const ibanError = trimmedIban.length > 0 && !isValidIban(trimmedIban);

  function handleSave() {
    if (ibanError) {
      Alert.alert(t('people.ibanInvalid'));
      return;
    }
    onSave({ name: name.trim(), iban: trimmedIban || null });
  }

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
            {ibanError && (
              <ThemedText type="small" themeColor="danger">
                {t('people.ibanInvalid')}
              </ThemedText>
            )}
            <View style={styles.buttonRow}>
              <View style={styles.buttonFlex}>
                <PrimaryButton
                  label={t('common.save')}
                  icon={{ ios: 'checkmark', android: 'check' }}
                  disabled={name.trim().length === 0 || ibanError}
                  onPress={handleSave}
                />
              </View>
              <View style={styles.buttonFlex}>
                <PrimaryButton
                  label={t('common.cancel')}
                  variant="secondary"
                  icon={{ ios: 'xmark', android: 'close' }}
                  onPress={onClose}
                />
              </View>
            </View>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  buttonFlex: {
    flex: 1,
  },
});
