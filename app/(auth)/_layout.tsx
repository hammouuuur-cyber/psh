import { Stack } from 'expo-router';

import { colors } from '@/lib/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ title: 'Créer un compte' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Mot de passe oublié' }} />
      <Stack.Screen name="reset-password" options={{ title: 'Nouveau mot de passe' }} />
    </Stack>
  );
}
