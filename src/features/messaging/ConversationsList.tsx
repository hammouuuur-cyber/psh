import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { useConversations } from '@/lib/queries';
import { colors, elevation, radii, spacing, typography } from '@/lib/theme';

type Props = {
  /** Préfixe de route vers l'écran de chat : "/(kine)/messages" ou "/(patient)/messages" */
  routePrefix: string;
  /** Texte affiché quand aucune conversation */
  emptyHint: string;
};

export function ConversationsList({ routePrefix, emptyHint }: Props) {
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;

  const { data: conversations, isLoading } = useConversations(userId);

  return (
    <Screen>
      <Text style={styles.title}>Messages</Text>

      {isLoading ? <Text style={styles.muted}>Chargement…</Text> : null}

      {!isLoading && (!conversations || conversations.length === 0) ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
          <Text style={styles.muted}>{emptyHint}</Text>
        </View>
      ) : null}

      {conversations?.map(({ link, lastMessage, unreadCount }) => {
        // On affiche l'autre partie
        const other = userId === link.kine_id ? link.patient : link.kine;
        const name = other?.display_name ?? (userId === link.kine_id ? 'Patient' : 'Kiné');
        const preview = lastMessage?.body ?? 'Aucun message pour l\'instant';
        const previewIsMine = lastMessage?.sender_id === userId;

        return (
          <Pressable
            key={link.id}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={() => router.push(`${routePrefix}/${link.id}` as never)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Text style={styles.name} numberOfLines={1}>
                  {name}
                </Text>
                {lastMessage ? (
                  <Text style={styles.time}>{formatTime(lastMessage.created_at)}</Text>
                ) : null}
              </View>
              <Text
                style={[styles.preview, unreadCount > 0 && styles.previewUnread]}
                numberOfLines={1}
              >
                {previewIsMine ? 'Vous : ' : ''}
                {preview}
              </Text>
            </View>
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            )}
          </Pressable>
        );
      })}
    </Screen>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  }
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text },
  muted: { ...typography.body, color: colors.textMuted, textAlign: 'center' },

  emptyState: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },

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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  avatarText: { ...typography.h3, color: colors.primary },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  time: { ...typography.small, color: colors.textMuted },
  preview: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  previewUnread: { color: colors.text, fontWeight: '600' },

  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { ...typography.small, color: colors.text, fontWeight: '700' },
});
