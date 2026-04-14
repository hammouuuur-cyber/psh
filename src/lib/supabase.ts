import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createClient, processLock } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined);

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL ou EXPO_PUBLIC_SUPABASE_ANON_KEY manquant. ' +
      'Copier .env.example vers .env et renseigner vos identifiants.',
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'https://invalid.local',
  supabaseAnonKey ?? 'anon',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // Important : en React Native le lock `navigator.locks` par défaut
      // provoque des erreurs « Lock was released because another request
      // stole it » car l'API web n'est pas réellement supportée. `processLock`
      // est un verrou in-process fourni par supabase-js, adapté à RN.
      lock: processLock,
    },
  },
);

// Coupe l'auto-refresh du token quand l'app passe en arrière-plan et le
// relance à la reprise. Recommandé par Supabase pour React Native afin
// d'éviter des appels réseau inutiles et les races de rafraîchissement.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
