import { Tabs } from 'expo-router';

import { colors } from '@/lib/theme';

export default function KineLayout() {
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
      <Tabs.Screen name="exercises/index" options={{ title: 'Exercices' }} />
      <Tabs.Screen name="programs/index" options={{ title: 'Programmes' }} />
      <Tabs.Screen name="account" options={{ title: 'Compte' }} />
      <Tabs.Screen name="exercises/[id]" options={{ href: null, title: 'Exercice' }} />
      <Tabs.Screen name="programs/[id]" options={{ href: null, title: 'Programme' }} />
    </Tabs>
  );
}
