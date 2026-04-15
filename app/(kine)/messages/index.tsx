import { ConversationsList } from '@/features/messaging/ConversationsList';

export default function KineMessagesList() {
  return (
    <ConversationsList
      routePrefix="/(kine)/messages"
      emptyHint="Aucune conversation pour l'instant. Invitez un patient depuis l'onglet « Patients »."
    />
  );
}
