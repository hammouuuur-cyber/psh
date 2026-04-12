import { Tabs } from 'expo-router';

import { colors } from '@/lib/theme';

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="catalog" options={{ title: 'Exercices' }} />
      <Tabs.Screen name="my-programs" options={{ title: 'Mes programmes' }} />
      <Tabs.Screen name="account" options={{ title: 'Compte' }} />
      <Tabs.Screen name="exercise/[id]" options={{ href: null, title: 'Exercice' }} />
      <Tabs.Screen name="program/[id]" options={{ href: null, title: 'Programme' }} />
    </Tabs>
  );
}
