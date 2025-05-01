
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Handler for CORS preflight requests
function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
    });
  }
  return null;
}

/**
 * This function handles webhook requests from slave servers
 */
serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const requestData = await req.json();
    
    // Log the incoming webhook data
    console.log('Slave webhook received:', JSON.stringify(requestData));

    // Validate required fields
    if (!requestData.hostname || !requestData.ip || !requestData.name) {
      console.error('Missing required fields in webhook data');
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Metrics defaults if not provided
    const metrics = requestData.metrics || { cpu: 0, ram: 0, instances: 0 };
    
    // Check if this slave already exists by ID or hostname
    let slave;
    if (requestData.id) {
      // Find by ID
      const { data: slaveData, error: slaveError } = await supabase
        .from('slaves')
        .select('*')
        .eq('id', requestData.id)
        .limit(1)
        .single();
        
      if (!slaveError && slaveData) {
        slave = slaveData;
      }
    }
    
    // If not found by ID, try by hostname
    if (!slave) {
      const { data: slaveData, error: slaveError } = await supabase
        .from('slaves')
        .select('*')
        .eq('hostname', requestData.hostname)
        .limit(1)
        .single();
        
      if (!slaveError && slaveData) {
        slave = slaveData;
      }
    }
    
    let result;
    // If slave exists, update it
    if (slave) {
      const { data, error } = await supabase
        .from('slaves')
        .update({
          name: requestData.name,
          ip: requestData.ip,
          status: requestData.status || 'online',
          last_seen: new Date().toISOString(),
          cpu: metrics.cpu,
          ram: metrics.ram,
          instances: metrics.instances
        })
        .eq('id', slave.id)
        .select()
        .single();
        
      if (error) {
        throw new Error(`Failed to update slave: ${error.message}`);
      }
      
      result = data;
      
      console.log(`Updated slave ${slave.id}`);
    } 
    // If slave doesn't exist, insert it
    else {
      const { data, error } = await supabase
        .from('slaves')
        .insert({
          name: requestData.name,
          hostname: requestData.hostname,
          ip: requestData.ip,
          status: requestData.status || 'online',
          last_seen: new Date().toISOString(),
          cpu: metrics.cpu,
          ram: metrics.ram,
          instances: metrics.instances
        })
        .select()
        .single();
        
      if (error) {
        throw new Error(`Failed to insert slave: ${error.message}`);
      }
      
      result = data;
      
      // Log new slave registration
      await supabase
        .from('logs')
        .insert({
          level: 'info',
          source: 'system',
          message: `New slave registered: ${requestData.name} (${requestData.hostname})`,
          details: { hostname: requestData.hostname, ip: requestData.ip }
        });
      
      console.log(`Created new slave ${result.id}`);
    }
    
    // Return success with the updated/created slave data
    return new Response(JSON.stringify(result), {
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in slave-webhook:', error.message);
    
    // Log the error to Supabase
    try {
      await supabase
        .from('logs')
        .insert({
          level: 'error',
          source: 'slave-webhook',
          message: `Slave webhook error: ${error.message}`,
          details: { error: error.toString() }
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    // Return error response
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
