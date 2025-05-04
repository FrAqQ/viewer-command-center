import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const apiSecretKey = Deno.env.get('API_SECRET_KEY') || '';

const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to check if a user can start more viewers
async function canUserStartViewer(userId: string, count: number = 1): Promise<boolean> {
  // If no userId provided, allow it (e.g., for admin/test viewers)
  if (!userId) return true;
  
  try {
    // Get user's plan limit
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('plan_id, plans!inner(viewer_limit)')
      .eq('id', userId)
      .single();
      
    if (userError || !userData || !userData.plans) {
      console.error('Error fetching user plan:', userError);
      return false;
    }
    
    const planLimit = userData.plans.viewer_limit;
    
    // Count existing active viewers for this user
    const { count: viewerCount, error: countError } = await supabaseClient
      .from('viewers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'running');
      
    if (countError) {
      console.error('Error counting active viewers:', countError);
      return false;
    }
    
    const activeViewers = viewerCount || 0;
    return activeViewers + count <= planLimit;
  } catch (err) {
    console.error('Error checking user viewer limit:', err);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify API key
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${apiSecretKey}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const requestData = await req.json();
    const { type, slaveId, data } = requestData;

    // Process based on webhook type
    let responseData;
    
    if (type === 'status_update') {
      // Update slave status
      const { status, hostname, ip, metrics } = data;
      
      const { data: slave, error } = await supabaseClient
        .from('slaves')
        .upsert({
          id: slaveId,
          name: slaveId, // Use ID as name if not provided
          hostname: hostname || 'unknown',
          ip: ip || '0.0.0.0',
          status,
          last_seen: new Date().toISOString(),
          cpu: metrics?.cpu || 0,
          ram: metrics?.ram || 0,
          instances: metrics?.instances || 0
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error updating slave status:', error);
        responseData = { success: false, error: error.message };
      } else {
        responseData = { success: true, slave };
      }
    } 
    else if (type === 'viewer_update') {
      // Update viewer statuses
      const { viewers } = data;
      
      if (!Array.isArray(viewers)) {
        return new Response(
          JSON.stringify({ error: 'Invalid viewers data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const updates = await Promise.all(viewers.map(async (viewer) => {
        const { id, url, status, error: viewerError, screenshot } = viewer;
        
        // Update the viewer in the database
        const { data, error } = await supabaseClient
          .from('viewers')
          .update({
            status,
            error: viewerError || null,
            screenshot: screenshot || null
          })
          .eq('id', id)
          .select()
          .single();
          
        return { id, success: !error, data, error };
      }));
      
      responseData = { success: true, updates };
    } 
    else if (type === 'log_entry') {
      // Store log entry
      const { level, message, details } = data;
      
      const { data: log, error } = await supabaseClient
        .from('logs')
        .insert({
          level,
          message,
          source: slaveId,
          details,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error storing log entry:', error);
        responseData = { success: false, error: error.message };
      } else {
        responseData = { success: true, log };
      }
    } 
    else if (type === 'command_result') {
      // Update command status
      const { commandId, status, result } = data;
      
      const { data: command, error } = await supabaseClient
        .from('commands')
        .update({
          status,
          result
        })
        .eq('id', commandId)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating command status:', error);
        responseData = { success: false, error: error.message };
      } else {
        responseData = { success: true, command };
      }
    } 
    else if (type === 'get_pending_commands') {
      // Fetch pending commands for this slave
      const { data: commands, error } = await supabaseClient
        .from('commands')
        .select('*')
        .eq('status', 'pending')
        .eq('target', slaveId);
        
      if (error) {
        console.error('Error fetching pending commands:', error);
        responseData = { success: false, error: error.message };
      } else {
        // Process each command to check if it can be executed
        const processedCommands = await Promise.all(commands.map(async (command) => {
          // For spawn commands, check if the user has reached their limit
          if (command.type === 'spawn' && command.payload?.userId) {
            const canStart = await canUserStartViewer(command.payload.userId);
            if (!canStart) {
              // Update command status to failed
              await supabaseClient
                .from('commands')
                .update({
                  status: 'failed',
                  result: { error: 'User has reached their viewer limit' }
                })
                .eq('id', command.id);
                
              return { ...command, status: 'failed', canExecute: false };
            }
          }
          
          return { ...command, canExecute: true };
        }));
        
        responseData = { 
          success: true, 
          commands: processedCommands.filter(cmd => cmd.canExecute) 
        };
      }
    } 
    else {
      return new Response(
        JSON.stringify({ error: 'Unknown webhook type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
