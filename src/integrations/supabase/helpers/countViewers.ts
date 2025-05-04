
import { supabase } from '../client';

/**
 * Counts the number of running viewers for a specific user
 * 
 * @param userId User ID to check
 * @returns Number of currently running viewers
 */
export async function countRunningViewers(userId: string): Promise<number> {
  try {
    // First extract the query to prevent deep type instantiation
    const query = supabase
      .from('viewers')
      .select('', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'running');

    // Then cast to any to avoid TypeScript analyzing the complex return type
    const response = await query as any;

    if (response?.error) {
      console.error('Error while counting viewers:', response.error);
      return 0;
    }

    return response.count || 0;
  } catch (error) {
    console.error('Unexpected error counting viewers:', error);
    return 0;
  }
}
