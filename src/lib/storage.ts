import { supabase } from './supabase';

/**
 * Retourne une URL signée (valide 1h) pour un asset privé du Storage.
 */
export async function getSignedUrl(
  bucket: 'exercise-videos' | 'exercise-images',
  path: string,
  expiresInSec = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSec);
  if (error) {
    console.warn('[storage] signed url error', error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}

/**
 * Upload d'un fichier local (uri) vers un bucket Supabase Storage.
 * Le chemin est préfixé par l'id de l'utilisateur courant (requis par les policies).
 */
export async function uploadFile(
  bucket: 'exercise-videos' | 'exercise-images',
  localUri: string,
  fileName: string,
  contentType: string,
): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Non authentifié');

  const path = `${userId}/${Date.now()}-${fileName}`;

  // React Native : convertir l'URI locale en blob
  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType,
    upsert: false,
  });

  if (error) {
    console.warn('[storage] upload error', error.message);
    return null;
  }
  return path;
}
