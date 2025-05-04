
import { createClient } from '@supabase/supabase-js';

// Ungenerics Supabase-Client ohne Database-Typdefinition
// Dies verhindert die tiefe Typinstanziierung bei count-Abfragen
const rawSupabase = createClient(
  "https://qdxpxqdewqrbvlsajeeo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkeHB4cWRld3FyYnZsc2FqZWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NzM0MDMsImV4cCI6MjA1MzI0OTQwM30.-wnDf1hMWOow3O1kbcTfC3mw59h-5SsmdFGhp5bKgUE"
);

/**
 * Counts the number of running viewers for a specific user
 * 
 * @param userId User ID to check
 * @returns Number of currently running viewers
 */
export async function countRunningViewers(userId: string): Promise<number> {
  try {
    // Verwende den ungenerischen Client für die Abfrage mit count
    const query = rawSupabase
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
