import { supabase } from './supabaseClient';

/**
 * Finds or creates a chat between two users and returns the chat ID.
 */
export async function getOrCreateChat(userAId: string, userBId: string): Promise<string | null> {
  if (!userAId || !userBId || userAId === userBId) return null;

  // 1. Check if a chat already exists between these two users
  // We look for a chat where both are participants
  const { data: existingChats, error: searchError } = await supabase
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', userAId);

  if (searchError || !existingChats) return null;

  const chatIds = existingChats.map(c => c.chat_id);

  if (chatIds.length > 0) {
    const { data: commonChat, error: commonError } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .in('chat_id', chatIds)
      .eq('user_id', userBId)
      .maybeSingle();

    if (!commonError && commonChat) {
      return commonChat.chat_id;
    }
  }

  // 2. No existing chat, create a new one
  const { data: newChat, error: createError } = await supabase
    .from('chats')
    .insert({})
    .select()
    .single();

  if (createError || !newChat) {
    console.error('Error creating chat:', createError);
    return null;
  }

  // 3. Add participants
  const { error: partError } = await supabase
    .from('chat_participants')
    .insert([
      { chat_id: newChat.id, user_id: userAId },
      { chat_id: newChat.id, user_id: userBId }
    ]);

  if (partError) {
    console.error('Error adding participants:', partError);
    return null;
  }

  return newChat.id;
}
