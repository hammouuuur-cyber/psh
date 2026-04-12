import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { colors } from '@/lib/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

function RootRouter() {
  const { loading, session, profile } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const first = segments[0];
    const inAuth = first === '(auth)';
    const inOnboarding = first === 'onboarding';

    if (!session) {
      if (!inAuth) router.replace('/(auth)/sign-in');
      return;
    }

    // Session existe mais profil pas encore chargé / créé
    if (!profile) {
      if (!inAuth) router.replace('/(auth)/sign-in');
      return;
    }

    if (profile.role === 'patient') {
      // L'onboarding est optionnel : on y envoie si interests vide
      if ((!profile.interests || profile.interests.length === 0) && !inOnboarding) {
        router.replace('/onboarding');
        return;
      }
      if (first !== '(patient)' && !inOnboarding) {
        router.replace('/(patient)');
      }
    } else if (profile.role === 'kine') {
      if (first !== '(kine)') {
        router.replace('/(kine)/exercises');
      }
    }
  }, [loading, session, profile, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
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
