import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/Screen';
import { Text } from 'react-native';
import { ChatScreen } from '@/features/messaging/ChatScreen';
import { supabase } from '@/lib/supabase';
import type { CareLink, Profile } from '@/types/database';

export default function KineChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: link, isLoading } = useQuery({
    enabled: !!id,
    queryKey: ['care_link', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('care_links')
        .select(
          'id, kine_id, patient_id, status, created_at, patient:profiles!care_links_patient_id_fkey(id, display_name)',
        )
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as
        | (CareLink & { patient: Pick<Profile, 'id' | 'display_name'> | null })
        | null;
    },
  });

  if (isLoading || !link) {
    return (
      <Screen>
        <Text>Chargement…</Text>
      </Screen>
    );
  }

  return (
    <ChatScreen careLinkId={link.id} title={link.patient?.display_name ?? 'Patient'} />
  );
}
