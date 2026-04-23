import { supabase } from './supabaseClient';

/**
 * Finds or creates a chat between two users and returns the chat ID.
 */
export async function getOrCreateChat(userAId: string, userBId: string): Promise<string | null> {
  if (!userAId || !userBId || userAId === userBId) return null;

  try {
    const { data, error } = await supabase.rpc('get_or_create_chat', {
      p_user_b_id: userBId
    });

    if (error) {
      console.error('Error in get_or_create_chat RPC:', error);
      throw error;
    }

    return data as string;
  } catch (err) {
    console.error('Unexpected error creating chat:', err);
    throw err;
  }
}
