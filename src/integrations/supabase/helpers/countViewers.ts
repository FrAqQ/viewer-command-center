
import { supabase } from '../client';

/**
 * Counts the number of running viewers for a specific user
 * 
 * @param userId User ID to check
 * @returns Number of currently running viewers
 */
export async function countRunningViewers(userId: string): Promise<number> {
  const query: any = supabase
    .from('viewers')
    .select('', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'running');

  const response = await query;

  if (response?.error) {
    console.error('Error while counting viewers:', response.error);
    return 0;
  }

  return response.count || 0;
}
