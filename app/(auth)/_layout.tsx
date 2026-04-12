import { Stack } from 'expo-router';

import { colors } from '@/lib/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: 'Connexion' }} />
      <Stack.Screen name="sign-up" options={{ title: 'Créer un compte' }} />
    </Stack>
  );
}
