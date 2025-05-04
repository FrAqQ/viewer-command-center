
import { supabase } from '../client';

/**
 * Counts the number of running viewers for a specific user
 * 
 * @param userId User ID to check
 * @returns Number of currently running viewers
 */
export async function countRunningViewers(userId: string): Promise<number> {
  try {
    // Explizit als any typisieren, um das TypeScript-Problem mit übermäßig tiefer Typinstanziierung zu umgehen
    const query: any = supabase
      .from('viewers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'running');

    const result = await query;

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
