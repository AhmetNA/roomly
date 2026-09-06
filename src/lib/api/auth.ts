import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// Closes the in-app browser sheet once the OAuth redirect lands back in the app
// (a no-op on native, but required on web so the popup doesn't hang open).
WebBrowser.maybeCompleteAuthSession();

// Supabase (and our own RPC `raise exception`s) return English messages meant for
// logs, not end users — map the ones we can identify to i18n keys and fall back
// to a generic translated message for anything else.
export function getAuthErrorMessageKey(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Invalid login credentials')) return 'auth.errors.invalidCredentials';
  if (message.includes('User already registered')) return 'auth.errors.emailInUse';
  if (message.includes('Password should be at least')) return 'auth.errors.weakPassword';
  if (message.includes('already_in_household')) return 'auth.errors.alreadyInHousehold';
  if (message.includes('invite_code_not_found')) return 'onboarding.errors.inviteCodeNotFound';
  return 'auth.errors.generic';
}

export async function signUpWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Google sign-in opens the OAuth consent page in an in-app browser (no native
// Google Sign-In SDK needed — keeps this on Supabase's free Auth tier and avoids
// a native rebuild), then exchanges the redirected `code` for a session.
//
// On web there's no in-app browser or deep link to come back through — Supabase
// does a full-page redirect to Google and back, and `detectSessionInUrl` (set on
// the web client in lib/supabase.ts) picks the `?code=` param up automatically
// once the page reloads, so this call never returns on that path.
export async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
    return;
  }

  const redirectTo = makeRedirectUri({ scheme: 'roomly', path: 'auth-callback' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return;

  const url = new URL(result.url);
  const code = url.searchParams.get('code');
  if (!code) throw new Error('oauth_no_code');

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}
