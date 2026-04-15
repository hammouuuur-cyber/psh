import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { PathologyPicker } from '@/components/PathologyPicker';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { usePublicExercises } from '@/lib/queries';
import { colors, elevation, radii, spacing, typography } from '@/lib/theme';

export default function CatalogScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<string[]>(profile?.interests ?? []);
  const [search, setSearch] = useState('');
  const { data, isLoading } = usePublicExercises(filter.length ? filter : undefined);

  const filtered = (data ?? []).filter((ex) =>
    search.trim().length === 0
      ? true
      : ex.title.toLowerCase().includes(search.toLowerCase()) ||
        (ex.description ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Screen>
      <Text style={styles.title}>Catalogue</Text>

      {/* Barre de recherche */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un exercice…"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Filtres par pathologie */}
      <Text style={styles.filterLabel}>Filtrer par pathologie</Text>
      <PathologyPicker selected={filter} onChange={setFilter} />

      {/* Résultats */}
      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        {isLoading ? <Text style={styles.muted}>Chargement…</Text> : null}
        {!isLoading && filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="body-outline" size={40} color={colors.textMuted} />
            <Text style={styles.muted}>
              {search.trim().length > 0
                ? `Aucun exercice pour « ${search} »`
                : 'Aucun exercice pour ces filtres.'}
            </Text>
          </View>
        ) : null}
        {filtered.map((ex) => (
          <Pressable
            key={ex.id}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={() => router.push(`/(patient)/exercise/${ex.id}` as never)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{ex.title}</Text>
              {ex.description ? (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {ex.description}
                </Text>
              ) : null}
              <Text style={styles.meta}>
                {ex.default_sets ?? 3} séries ·{' '}
                {ex.default_duration_sec
                  ? `${ex.default_duration_sec}s`
                  : `${ex.default_reps ?? '?'} reps`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    ...elevation(1),
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    padding: 0,
  },

  filterLabel: { ...typography.small, color: colors.textMuted, marginTop: spacing.sm },

  emptyState: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  muted: { ...typography.body, color: colors.textMuted, textAlign: 'center' },

  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...elevation(1),
  },
  cardTitle: { ...typography.bodyStrong, color: colors.text },
  cardDesc: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  meta: { ...typography.small, color: colors.primary, marginTop: 4 },
});
