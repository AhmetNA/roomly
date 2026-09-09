import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppSymbol } from '@/components/app-symbol';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import type { ReceiptPhoto } from '@/lib/api/receipts';

export function ExpenseAttachments({
  text,
  onChangeText,
  photo,
  onChangePhoto,
  allowPhoto = true,
  disabled,
}: {
  text: string;
  onChangeText: (value: string) => void;
  photo: ReceiptPhoto | null;
  onChangePhoto: (value: ReceiptPhoto | null) => void;
  // Editing an expense cannot change its photo (the old file would be orphaned),
  // so the picker is hidden rather than offering something that gets dropped.
  allowPhoto?: boolean;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [picking, setPicking] = useState(false);
  const count = text.split('\n').filter((line) => line.trim()).length;
  const summary = [
    count ? t('expenses.itemsCount', { count }) : '',
    photo ? t('expenses.receiptAdded') : '',
  ]
    .filter(Boolean)
    .join(' · ');

  async function pickPhoto(camera: boolean) {
    if (picking || disabled) return;
    setPicking(true);
    try {
      if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) {
        showAlert(t('expenses.cameraPermission'));
        return;
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        base64: true,
        quality: 0.7,
      };
      const result = camera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.base64) throw new Error('missing_photo');
      if (asset.base64.length * 0.75 > 5 * 1024 * 1024) {
        showAlert(t('expenses.photoSize'));
        return;
      }
      const mimeType = Platform.OS === 'web' ? asset.mimeType : 'image/jpeg';
      if (mimeType !== 'image/jpeg' && mimeType !== 'image/png' && mimeType !== 'image/webp') {
        showAlert(t('expenses.photoFormat'));
        return;
      }
      onChangePhoto({ uri: asset.uri, base64: asset.base64, mimeType });
    } catch {
      showAlert(t('expenses.photoError'));
    } finally {
      setPicking(false);
    }
  }

  return (
    <View style={[styles.container, { borderColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={styles.header}
      >
        <AppSymbol
          name={{ ios: 'paperclip', android: 'attach_file' }}
          size={18}
          tintColor={theme.textSecondary}
        />
        <View style={styles.label}>
          <ThemedText type="smallBold">{t('expenses.attachments')}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {summary || t('expenses.optional')}
          </ThemedText>
        </View>
        <AppSymbol
          name={
            expanded
              ? { ios: 'chevron.up', android: 'expand_less' }
              : { ios: 'chevron.down', android: 'expand_more' }
          }
          size={16}
          tintColor={theme.textSecondary}
        />
      </Pressable>
      {expanded && (
        <View style={styles.body}>
          <TextField
            label={t('expenses.itemsLabel')}
            placeholder={t('expenses.itemsPlaceholder')}
            value={text}
            onChangeText={onChangeText}
            multiline
            textAlignVertical="top"
            style={styles.input}
            editable={!disabled}
            maxLength={10050}
          />
          <ThemedText type="small" themeColor="textSecondary">
            {t('expenses.itemsHint')}
          </ThemedText>
          {!allowPhoto && (
            <ThemedText type="small" themeColor="textSecondary">
              {t('expenses.receiptLocked')}
            </ThemedText>
          )}
          {allowPhoto && photo && (
            <Image
              source={{ uri: photo.uri }}
              accessibilityLabel={t('expenses.receipt')}
              style={styles.thumbnail}
              resizeMode="contain"
            />
          )}
          {allowPhoto && (
            <>
              <View style={styles.buttons}>
                <View style={styles.label}>
                  <PrimaryButton
                    label={t('expenses.choosePhoto')}
                    variant="secondary"
                    disabled={disabled || picking}
                    onPress={() => pickPhoto(false)}
                  />
                </View>
                {Platform.OS !== 'web' && (
                  <View style={styles.label}>
                    <PrimaryButton
                      label={t('expenses.takePhoto')}
                      variant="secondary"
                      disabled={disabled || picking}
                      onPress={() => pickPhoto(true)}
                    />
                  </View>
                )}
              </View>
              {photo && (
                <PrimaryButton
                  label={t('expenses.removePhoto')}
                  variant="secondary"
                  disabled={disabled || picking}
                  onPress={() => onChangePhoto(null)}
                />
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: Spacing.two },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  label: { flex: 1 },
  body: { gap: Spacing.two, paddingBottom: Spacing.three },
  input: { minHeight: 100 },
  thumbnail: { height: 140, width: '100%', borderRadius: Spacing.two },
  buttons: { flexDirection: 'row', gap: Spacing.two },
});
