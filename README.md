# PSH Kiné — Exercices pour maladies neuromusculaires

Application mobile (Expo / React Native + Supabase) permettant :

- aux **patients** atteints de maladies neuromusculaires (paraparésie spastique héréditaire, SEP, SLA, myopathies, etc.) de consulter des exercices de kinésithérapie adaptés à leur pathologie avec **vidéos**, **images**, **instructions** et un **minuteur intégré** pour les séances (séries × répétitions × durée × repos) ;
- aux **kinésithérapeutes** de créer des exercices et de les regrouper en programmes, avec possibilité de les rendre publics pour qu'ils apparaissent dans le catalogue des patients.

Les deux rôles fonctionnent **indépendamment** : un patient peut s'abonner à n'importe quel programme public sans être lié à un kiné spécifique.

## Stack

- **Mobile** : React Native + Expo (TypeScript), `expo-router`, `expo-video`, `expo-keep-awake`, `expo-haptics`, `expo-image-picker`
- **Données** : TanStack Query + `@supabase/supabase-js`
- **Backend** : Supabase (Auth + Postgres + RLS + Storage)

## Démarrage

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer Supabase

Voir **`supabase/README.md`** : créer un projet, exécuter `migrations/0001_init.sql` puis `seed.sql`, créer les buckets Storage `exercise-videos` et `exercise-images` avec les policies indiquées.

### 3. Variables d'environnement

Copier `.env.example` vers `.env` et renseigner :

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

### 4. Lancer l'application

```bash
npm run start
```

Scanner le QR code avec **Expo Go** depuis votre téléphone. Sur iOS pour les vidéos il est recommandé d'utiliser un dev client (`npx expo run:ios`) plutôt qu'Expo Go.

## Parcours de test recommandé

1. **Créer un compte kiné** via l'écran d'inscription
2. Créer un exercice (titre, durée, pathologies ciblées), l'enregistrer puis uploader une vidéo
3. Cocher « Visible par tous les patients »
4. Créer un programme et y ajouter l'exercice
5. Se déconnecter, **créer un compte patient**, sélectionner une pathologie à l'onboarding
6. Voir le programme public sur l'accueil, s'y abonner, ouvrir l'exercice et lancer le minuteur

## Structure

```
app/              # routes expo-router
  (auth)/         # sign-in, sign-up
  (patient)/      # tabs : accueil, catalogue, mes programmes, compte, détails
  (kine)/         # tabs : exercices, programmes, compte, édition
  onboarding.tsx  # sélection pathologies patient
  _layout.tsx     # routing racine selon rôle
src/
  components/     # Button, TextField, VideoPlayer, ExerciseTimer, UploadMedia…
  features/auth/  # AuthContext
  lib/            # supabase client, storage helpers, queries, theme
  types/          # types DB
supabase/
  migrations/     # schéma + RLS
  seed.sql        # pathologies de référence
```

## À venir (hors MVP)

- Suivi d'observance patient (sessions réalisées, douleur ressentie)
- Lien explicite patient ↔ kiné via code d'invitation
- Hébergement HDS si publication store
- Notifications locales de rappel de séance
- Mode hors-ligne pour consulter les exercices sans connexion
