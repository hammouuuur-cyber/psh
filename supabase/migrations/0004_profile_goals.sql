-- Ajoute une colonne `goals` (objectifs thérapeutiques du patient)
-- et `display_name` si elle n'existe pas encore.
-- Les objectifs sont stockés en tableau de codes texte :
-- 'equilibre' | 'raideurs' | 'renforcement' | 'coordination' | 'douleur' | 'marche'

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS goals text[] NOT NULL DEFAULT '{}';
