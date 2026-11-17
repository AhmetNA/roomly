import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
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
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : String(error);
  if (message.includes('Invalid login credentials')) return 'auth.errors.invalidCredentials';
  if (message.includes('User already registered')) return 'auth.errors.emailInUse';
  if (message.includes('Password should be at least')) return 'auth.errors.weakPassword';
  if (message.includes('already_in_household')) return 'auth.errors.alreadyInHousehold';
  if (message.includes('invite_code_not_found')) return 'onboarding.errors.inviteCodeNotFound';
  if (typeof error === 'object' && error !== null && 'code' in error) {
    // ERR_REQUEST_UNKNOWN is what iOS reports when no Apple Account is signed in
    // on the device (or Sign in with Apple is otherwise unavailable).
    if (error.code === 'ERR_REQUEST_UNKNOWN' || error.code === 'ERR_REQUEST_NOT_HANDLED') {
      return 'auth.errors.appleUnavailable';
    }
  }
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

export async function isAppleSignInAvailable() {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

function isAppleCancel(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ERR_REQUEST_CANCELED'
  );
}

// Native Sign in with Apple (App Store guideline 4.8 requires it next to Google).
// Apple gets the SHA-256 of the nonce, Supabase gets the raw one to verify the
// token. Apple only returns the user's name on the very first authorization, so
// it is saved to user metadata right away for onboarding to prefill.
// Returns false when the user cancels the Apple sheet.
export async function signInWithApple(): Promise<boolean> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if (isAppleCancel(error)) return false;
    throw error;
  }

  if (!credential.identityToken) throw new Error('apple_no_identity_token');

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;

  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ');
  if (fullName) {
    await supabase.auth.updateUser({ data: { full_name: fullName } });
  }
  return true;
}

// Apple requires revoking its tokens when an Apple account is deleted. A fresh
// authorization code is requested right before deletion and the server
// exchanges and revokes it (see supabase/functions/delete-account/apple.ts).
// Returns null when the user cancels the Apple sheet.
export async function getAppleAuthorizationCode(): Promise<string | null> {
  try {
    const credential = await AppleAuthentication.signInAsync({ requestedScopes: [] });
    if (!credential.authorizationCode) throw new Error('apple_no_authorization_code');
    return credential.authorizationCode;
  } catch (error) {
    if (isAppleCancel(error)) return null;
    throw error;
  }
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

  // An ephemeral session skips iOS's "Roomly wants to use <supabase domain> to
  // sign in" prompt, which shows the Supabase project host instead of our name.
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    preferEphemeralSession: true,
  });
  if (result.type !== 'success') return;

  const url = new URL(result.url);
  const code = url.searchParams.get('code');
  if (!code) throw new Error('oauth_no_code');

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}
