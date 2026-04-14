import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export interface ChatParticipant {
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
}

export interface Chat {
  id: string;
  created_at: string;
  last_message_at: string;
  last_message_content: string;
  participants: ChatParticipant[];
  unread_count?: number;
}

export function useChats(userId: string | undefined) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchChats = async () => {
      setLoading(true);
      
      // 1. Get all chat IDs the user participates in
      const { data: participantData, error: partError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', userId);

      if (partError || !participantData) {
        console.error('Error fetching chat IDs:', partError);
        setLoading(false);
        return;
      }

      const chatIds = participantData.map(p => p.chat_id);
      if (chatIds.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }

      // 2. Fetch full chat objects with other participants
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select(`
          id,
          created_at,
          last_message_at,
          last_message_content,
          chat_participants (
            user_id,
            profiles (
              display_name,
              avatar_url
            )
          )
        `)
        .in('id', chatIds)
        .order('last_message_at', { ascending: false });

      if (chatsError) {
        console.error('Error fetching chats:', chatsError);
      } else {
        // Map the data to our interface
        const formattedChats = (chatsData || []).map(chat => ({
          ...chat,
          participants: (chat.chat_participants as any[]).map(p => ({
            user_id: p.user_id,
            profiles: p.profiles
          }))
        })) as Chat[];
        
        setChats(formattedChats);
      }
      setLoading(false);
    };

    fetchChats();

    // 3. Subscribe to chat changes
    const channel = supabase
      .channel('public:chats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats'
        },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return { chats, loading };
}
