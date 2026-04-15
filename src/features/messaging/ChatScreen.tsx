import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthContext';
import { useMessages } from '@/lib/queries';
import { supabase } from '@/lib/supabase';
import { colors, elevation, radii, spacing, typography } from '@/lib/theme';
import type { Message } from '@/types/database';

type Props = {
  careLinkId: string;
  title: string; // nom de l'interlocuteur
};

/**
 * Chat partagé kiné ↔ patient sur un care_link.
 * Polling via useMessages (refetch 5s). Envoi optimiste non implémenté
 * en MVP : on attend la confirmation du serveur avant d'afficher.
 */
export function ChatScreen({ careLinkId, title }: Props) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const { data: messages } = useMessages(careLinkId);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages?.length]);

  // Marquer les messages reçus comme lus
  useEffect(() => {
    if (!userId || !messages) return;
    const unread = messages.filter((m) => m.sender_id !== userId && !m.read_at);
    if (unread.length === 0) return;
    const ids = unread.map((m) => m.id);
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', ids)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
      });
  }, [messages, userId, queryClient]);

  const send = async () => {
    const trimmed = body.trim();
    if (!trimmed || !userId) return;
    setSending(true);
    const { error } = await supabase
      .from('messages')
      .insert({ care_link_id: careLinkId, sender_id: userId, body: trimmed });
    setSending(false);
    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }
    setBody('');
    queryClient.invalidateQueries({ queryKey: ['messages', careLinkId] });
    queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
  };

  const renderItem = ({ item }: { item: Message }) => {
    const mine = item.sender_id === userId;
    return (
      <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>{item.body}</Text>
          <Text style={[styles.time, mine ? styles.timeMine : styles.timeTheirs]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Screen scroll={false} style={{ padding: 0, gap: 0 }}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {messages && messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
          <Text style={styles.muted}>
            Aucun message pour l'instant.{'\n'}Dites bonjour ! 🌿
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages ?? []}
          renderItem={renderItem}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          style={{ flex: 1 }}
        />
      )}

      {/* Barre de saisie */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Écrire un message…"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
        />
        <Pressable
          onPress={send}
          disabled={sending || body.trim().length === 0}
          style={({ pressed }) => [
            styles.sendBtn,
            (body.trim().length === 0 || sending) && styles.sendBtnDisabled,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="send" size={18} color={colors.text} />
        </Pressable>
      </View>
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
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
  title: { ...typography.h2, color: colors.text },

  list: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },

  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },

  bubble: {
    maxWidth: '78%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    ...elevation(1),
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleTextMine: { ...typography.body, color: '#0F1510' },
  bubbleTextTheirs: { ...typography.body, color: colors.text },
  time: { ...typography.small, fontSize: 10, marginTop: 4 },
  timeMine: { color: '#0F151099', textAlign: 'right' },
  timeTheirs: { color: colors.textMuted, textAlign: 'left' },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  muted: { ...typography.body, color: colors.textMuted, textAlign: 'center' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation(2),
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
