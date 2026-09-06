/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    accent: '#007AFF',
    // Text/icon color for content sitting on top of a solid `accent` background
    // (buttons, selected chips) — white reads correctly against both themes' accent blue.
    onAccent: '#ffffff',
    success: '#34C759',
    danger: '#FF3B30',
    border: '#E3E3E8',
    // Scrim behind a centered popup/sheet — same dim value in both themes,
    // since it sits on top of whatever content is already themed underneath.
    overlay: '#00000088',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    accent: '#0A84FF',
    onAccent: '#ffffff',
    success: '#30D158',
    danger: '#FF453A',
    border: '#2C2C2E',
    overlay: '#00000088',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// How much room the bottom tab bar takes, so floating content can clear it.
// Web renders its own tab bar (components/app-tabs.web.tsx) rather than the
// native one, and that pill sits in a 76pt-tall strip.
export const BottomTabInset = Platform.select({ ios: 30, android: 48, web: 76 }) ?? 0;
export const MaxContentWidth = 800;

// A soft, low, black-based shadow reads as "lifted" in both themes (dark mode
// shadows are still conventionally black, just less visible) — this is a
// physical light-simulation constant, not a themed design color, so it lives
// here once rather than as a per-palette token.
export const CardShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 2,
} as const;

export const PopupShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.2,
  shadowRadius: 24,
  elevation: 12,
} as const;
