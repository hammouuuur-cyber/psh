import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

/**
 * Les liens de récupération de mot de passe Supabase renvoient vers
 *   pshkine://reset-password#access_token=...&refresh_token=...&type=recovery
 * On intercepte le deep link pour poser la session et rediriger sur l'écran.
 */
function useAuthDeepLinks() {
  const router = useRouter();

  useEffect(() => {
    const handle = async (url: string) => {
      try {
        const parsed = Linking.parse(url);
        // Supabase met les tokens dans le fragment `#...` que expo-linking range
        // dans `queryParams` uniquement si l'URL est bien formée.
        const raw = url.split('#')[1] ?? url.split('?')[1] ?? '';
        const qp = Object.fromEntries(new URLSearchParams(raw));
        const type = qp.type ?? parsed.queryParams?.type;
        const accessToken = qp.access_token ?? parsed.queryParams?.access_token;
        const refreshToken = qp.refresh_token ?? parsed.queryParams?.refresh_token;

        const isResetPath =
          parsed.path === 'reset-password' ||
          parsed.hostname === 'reset-password' ||
          url.includes('reset-password');

        if (type === 'recovery' && accessToken && refreshToken && isResetPath) {
          const { error } = await supabase.auth.setSession({
            access_token: String(accessToken),
            refresh_token: String(refreshToken),
          });
          if (error) {
            router.replace({ pathname: '/(auth)/reset-password', params: { status: 'invalid' } });
          } else {
            router.replace('/(auth)/reset-password');
          }
        }
      } catch {
        // Silencieux : si le parsing échoue on laisse le routing normal opérer.
      }
    };

    (async () => {
      const initial = await Linking.getInitialURL();
      if (initial) handle(initial);
    })();

    const sub = Linking.addEventListener('url', (event) => handle(event.url));
    return () => sub.remove();
  }, [router]);
}

function RootRouter() {
  const { loading, session, profile } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useAuthDeepLinks();

  useEffect(() => {
    if (loading) return;

    const first = segments[0];
    const inAuth = first === '(auth)';
    const inOnboarding = first === 'onboarding';

    // Pendant un flux reset password, on NE bascule PAS vers le dashboard :
    // l'utilisateur a une session mais doit d'abord choisir son nouveau mdp.
    const onResetPassword = segments.join('/').includes('reset-password');
    if (onResetPassword) return;

    if (!session) {
      if (!inAuth) router.replace('/(auth)/sign-in');
      return;
    }

    if (!profile) {
      if (!inAuth) router.replace('/(auth)/sign-in');
      return;
    }

    if (profile.role === 'patient') {
      if ((!profile.interests || profile.interests.length === 0) && !inOnboarding) {
        router.replace('/onboarding');
        return;
      }
      if (first !== '(patient)' && !inOnboarding) {
        router.replace('/(patient)');
      }
    } else if (profile.role === 'kine') {
      if (first !== '(kine)') {
        router.replace('/(kine)/patients');
      }
    }
  }, [loading, session, profile, segments, router]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="light" />
            <RootRouter />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
