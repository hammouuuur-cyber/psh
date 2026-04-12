import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Button } from './Button';
import { uploadFile } from '@/lib/storage';
import { colors, radii, spacing, typography } from '@/lib/theme';

type Props = {
  kind: 'video' | 'image';
  onUploaded: (storagePath: string) => void;
};

export function UploadMedia({ kind, onUploaded }: Props) {
  const [busy, setBusy] = useState(false);
  const [lastPath, setLastPath] = useState<string | null>(null);

  const pick = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission refusée', 'Accès à la galerie nécessaire.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          kind === 'video'
            ? ImagePicker.MediaTypeOptions.Videos
            : ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled || result.assets.length === 0) return;

      const asset = result.assets[0];
      setBusy(true);

      const name = asset.fileName ?? `media.${kind === 'video' ? 'mp4' : 'jpg'}`;
      const contentType = asset.mimeType ?? (kind === 'video' ? 'video/mp4' : 'image/jpeg');
      const bucket = kind === 'video' ? 'exercise-videos' : 'exercise-images';

      const path = await uploadFile(bucket, asset.uri, name, contentType);
      if (path) {
        setLastPath(path);
        onUploaded(path);
      } else {
        Alert.alert('Upload', 'Échec de l\'envoi du fichier.');
      }
    } catch (e) {
      Alert.alert('Erreur', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        label={kind === 'video' ? 'Ajouter une vidéo' : 'Ajouter une image'}
        variant="secondary"
        loading={busy}
        onPress={pick}
      />
      {lastPath ? <Text style={styles.hint}>Envoyé : {lastPath.split('/').pop()}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  hint: { ...typography.small, color: colors.success },
});
