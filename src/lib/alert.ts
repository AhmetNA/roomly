import { Alert, Platform, type AlertButton } from 'react-native';

// react-native-web ships an Alert stub whose alert() is an empty function, so
// every confirmation and error message in the app silently did nothing on web
// — sign out, leaving the household and each delete looked like dead buttons.
// The browser's own dialogs carry the same semantics, so web goes through
// those while native keeps the platform alert.
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;
  const confirmButton = buttons?.find((button) => button.style !== 'cancel');
  const cancelButton = buttons?.find((button) => button.style === 'cancel');

  // Without both a confirm and a cancel there is nothing to choose between,
  // so the dialog is an acknowledgement rather than a question.
  if (!confirmButton || !cancelButton) {
    window.alert(text);
    confirmButton?.onPress?.();
    return;
  }

  if (window.confirm(text)) {
    confirmButton.onPress?.();
  } else {
    cancelButton.onPress?.();
  }
}
