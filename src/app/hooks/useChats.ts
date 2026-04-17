import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export interface ChatParticipant {
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url: string;
    is_guide: boolean;
    last_seen: string | null;
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
              avatar_url,
              is_guide,
              last_seen
            )
          )
        `)
        .in('id', chatIds)
        .order('last_message_at', { ascending: false });

      if (chatsError) {
        console.error('Error fetching chats:', chatsError);
      } else {
        // Fetch unread messages
        let unreadCounts: Record<string, number> = {};
        if (userId) {
          const { data: unreadData } = await supabase
            .from('messages')
            .select('chat_id')
            .eq('is_read', false)
            .neq('sender_id', userId)
            .in('chat_id', chatIds);

          unreadCounts = (unreadData || []).reduce((acc, msg) => {
            acc[msg.chat_id] = (acc[msg.chat_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }

        // Map the data to our interface
        const formattedChats = (chatsData || []).map(chat => ({
          ...chat,
          unread_count: unreadCounts[chat.id] || 0,
          participants: (chat.chat_participants as any[] || []).map(p => ({
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
    const channelChats = supabase
      .channel('public:chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, fetchChats)
      .subscribe();

    const channelMessages = supabase
      .channel('public:messages_useChats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchChats)
      .subscribe();

    return () => {
      supabase.removeChannel(channelChats);
      supabase.removeChannel(channelMessages);
    };
  }, [userId]);

  return { chats, loading };
}
