import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  profiles?: {
    display_name: string;
    avatar_url: string;
  };
}

export function useMessages(chatId: string | undefined, currentUserId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        chat_id,
        sender_id,
        content,
        created_at,
        is_read,
        profiles:sender_id (
          display_name,
          avatar_url
        )
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data as any[]);
    }
    setLoading(false);
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

    fetchMessages();

    // Subscribe to new messages for this chat
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          // Fetch the full message with sender profile
          const { data, error } = await supabase
            .from('messages')
            .select(`
              id,
              chat_id,
              sender_id,
              content,
              created_at,
              is_read,
              profiles:sender_id (
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            setMessages(prev => [...prev, data as any]);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chatId, fetchMessages]);

  const sendMessage = async (content: string) => {
    if (!chatId || !currentUserId || !content.trim()) return;

    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: currentUserId,
        content: content.trim()
      });

    if (msgError) {
      console.error('Error sending message:', msgError);
      return false;
    }

    // Update the last message preview in the chat object
    await supabase
      .from('chats')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_content: content.trim()
      })
      .eq('id', chatId);

    return true;
  };

  const markAsRead = async () => {
    if (!chatId || !currentUserId) return;
    
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('chat_id', chatId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false);
  };

  return { messages, loading, sendMessage, markAsRead };
}
