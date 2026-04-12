import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

import { getSignedUrl } from '@/lib/storage';
import { colors, radii, spacing, typography } from '@/lib/theme';

type Props = {
  /** Chemin dans le bucket `exercise-videos` (ex: `uid/12345-foo.mp4`). */
  storagePath: string;
};

export function VideoPlayer({ storagePath }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const signed = await getSignedUrl('exercise-videos', storagePath, 3600);
        if (!cancelled) setUrl(signed);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  const player = useVideoPlayer(url ?? '', (p) => {
    p.loop = true;
  });

  if (error) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.error}>Impossible de charger la vidéo : {error}</Text>
      </View>
    );
  }

  if (!url) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <VideoView player={player} style={styles.video} nativeControls allowsFullscreen />;
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: radii.md,
  },
  placeholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  error: { ...typography.small, color: colors.danger, textAlign: 'center' },
});
