# Configuration Supabase

## 1. Créer le projet

1. Aller sur https://supabase.com et créer un nouveau projet (région **Europe (Frankfurt)** recommandée pour la latence et le RGPD).
2. Dans **Project Settings > API**, récupérer :
   - `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
   - `anon public key` → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Les coller dans `.env` à la racine du projet (copier `.env.example`).

## 2. Appliquer le schéma

Depuis le dashboard Supabase, onglet **SQL Editor**, exécuter dans l'ordre :

1. `migrations/0001_init.sql` — crée toutes les tables, fonctions et RLS.
2. `seed.sql` — peuple les pathologies de référence.

## 3. Créer les buckets Storage

Dans **Storage**, créer deux buckets **privés** :

- `exercise-videos`
- `exercise-images`

Puis dans **Storage > Policies**, ajouter ces policies (ou décommenter la section Storage de la migration et l'exécuter) :

```sql
-- Lecture : utilisateurs authentifiés
create policy "storage: auth can read exercise media"
  on storage.objects for select
  to authenticated
  using (bucket_id in ('exercise-videos', 'exercise-images'));

-- Upload : kiné sur son propre dossier (préfixe = user id)
create policy "storage: kine can upload own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('exercise-videos', 'exercise-images')
    and public.is_kine(auth.uid())
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Suppression : kiné sur ses propres fichiers
create policy "storage: kine can delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('exercise-videos', 'exercise-images')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

## 4. Auth

Dans **Authentication > Providers**, activer **Email**.
Pour le développement, désactiver la confirmation par email dans **Authentication > Email Templates** (optionnel).

## 5. Tester

Créer un utilisateur via l'app, vérifier dans **Table Editor > profiles** que la ligne est bien insérée avec le bon rôle.
