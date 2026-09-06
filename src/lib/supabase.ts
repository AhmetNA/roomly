// Supabase JS assumes a browser-style `URL`/fetch environment; React Native needs
// this polyfill loaded before the client is created.
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY missing (.env)');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    // On web the OAuth redirect lands back on the page itself with a `?code=`
    // param in the URL — Supabase must parse and exchange it there. On native
    // there's no page to reload, so this stays off and the deep-link callback
    // exchanges the code manually (see signInWithGoogle in lib/api/auth.ts).
    detectSessionInUrl: Platform.OS === 'web',
    // PKCE (not the implicit flow) is required for Google sign-in on native: the
    // OAuth redirect comes back as a deep link, and only PKCE's `code` param
    // survives that round-trip cleanly (the implicit flow's token is a URL
    // fragment, which native deep links don't reliably preserve). Works the
    // same way on web, so it's used unconditionally.
    flowType: 'pkce',
  },
});

// Supabase's token auto-refresh timer keeps running in the background unless the
// app is told when it's foregrounded/backgrounded — without this, sessions expire
// while the app is backgrounded and never silently refresh again on resume.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
