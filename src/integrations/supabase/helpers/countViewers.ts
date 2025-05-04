
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

    // Apply type assertion after the query is complete rather than in the chain
    const result = await query
      .eq('user_id', userId)
      .eq('status', 'running');
      
    // Safely extract count from the result
    const count = (result as any).count;
    const error = (result as any).error;

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
