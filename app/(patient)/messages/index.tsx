import { ConversationsList } from '@/features/messaging/ConversationsList';

export default function PatientMessagesList() {
  return (
    <ConversationsList
      routePrefix="/(patient)/messages"
      emptyHint="Pour échanger avec votre kiné, liez-vous d'abord à lui depuis Mon compte → « Mon kiné »."
    />
  );
}
