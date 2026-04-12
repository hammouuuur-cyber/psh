import { Redirect } from 'expo-router';

// Page racine : le RootLayout gère déjà la redirection selon rôle.
// Ce composant est juste un fallback.
export default function Index() {
  return <Redirect href="/(auth)/sign-in" />;
}
