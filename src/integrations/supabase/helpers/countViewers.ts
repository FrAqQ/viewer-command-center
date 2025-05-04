
import { supabase } from '../client';

/**
 * Counts the number of running viewers for a specific user
 * 
 * @param userId User ID to check
 * @returns Number of currently running viewers
 */
export async function countRunningViewers(userId: string): Promise<number> {
  try {
    // Separate the builder to avoid TS's deep instantiation bug
    const query = supabase
      .from('viewers')
      .select('id', { count: 'exact', head: true }); // use 'id' instead of '*' for minimal columns

    const { count, error } = await query
      .eq('user_id', userId)
      .eq('status', 'running') as unknown as { count: number | null; error: any };

    if (error) {
      console.error('Error while counting viewers:', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error('Unexpected error counting viewers:', error);
    return 0;
  }
}
