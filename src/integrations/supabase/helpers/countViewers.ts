
import { supabase } from '../client';

/**
 * Counts the number of running viewers for a specific user
 * 
 * @param userId User ID to check
 * @returns Number of currently running viewers
 */
export async function countRunningViewers(userId: string): Promise<number> {
  try {
    // Use '*' column instead of empty string to prevent deep type instantiation
    const response = await supabase
      .from('viewers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'running') as unknown as { count: number | null; error: any };

    if (response.error) {
      console.error('Error while counting viewers:', response.error);
      return 0;
    }

    return response.count || 0;
  } catch (error) {
    console.error('Unexpected error counting viewers:', error);
    return 0;
  }
}
