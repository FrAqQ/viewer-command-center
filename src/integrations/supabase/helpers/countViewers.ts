
import { supabase } from '../client';

/**
 * Counts the number of running viewers for a specific user
 * 
 * @param userId User ID to check
 * @returns Number of currently running viewers
 */
export async function countRunningViewers(userId: string): Promise<number> {
  try {
    const result = await (supabase
      .from('viewers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'running')) as unknown as { count: number | null; error: any };

    if (result.error) {
      console.error('Error while counting viewers:', result.error);
      return 0;
    }

    return result.count ?? 0;
  } catch (error) {
    console.error('Unexpected error counting viewers:', error);
    return 0;
  }
}
