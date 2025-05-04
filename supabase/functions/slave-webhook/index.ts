
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0"

console.log("Slave webhook function is running...")

// CORS headers for browser clients
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

// API Secret Key for authentication
const API_SECRET_KEY = Deno.env.get('API_SECRET_KEY') ?? ''

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    // API Key authentication
    const apiKey = req.headers.get('x-api-key')
    
    if (!apiKey || apiKey !== API_SECRET_KEY) {
      console.error('Invalid or missing API key')
      return new Response(JSON.stringify({ 
        error: 'Unauthorized. Invalid or missing API key.' 
      }), {
        status: 401,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }

    // Parse request body
    const requestBody = await req.json()
    
    // Extract common data from the request
    const { id: slaveId, name: slaveName, hostname, ip, status = 'online', metrics = {} } = requestBody
    console.log(`Received update from ${slaveName} (${slaveId || 'new slave'})`)

    // Handle the status update (main functionality for now)
    return await handleStatusUpdate(slaveId, slaveName, { 
      hostname,
      ip,
      status,
      metrics
    })
    
  } catch (error) {
    console.error('Error processing webhook:', error.message)
    
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})

// Handler for slave status updates
async function handleStatusUpdate(slaveId: string, slaveName: string, data: any) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data payload for status_update')
  }

  const { status, metrics } = data
  
  // Generate a UUID if not provided (for new slaves)
  const effectiveSlaveId = slaveId || crypto.randomUUID()

  // Use upsert with conflict target on id
  const { data: upsertedSlave, error: upsertError } = await supabaseClient
    .from('slaves')
    .upsert([{
      id: effectiveSlaveId,
      name: slaveName,
      hostname: data.hostname || 'Unknown',
      ip: data.ip || '0.0.0.0',
      status: status,
      last_seen: new Date().toISOString(),
      cpu: metrics?.cpu || 0,
      ram: metrics?.ram || 0,
      instances: metrics?.instances || 0
    }], { 
      onConflict: 'id' // Important: This ensures we update existing records
    })
    .select()

  if (upsertError) {
    console.error(`Error upserting slave:`, upsertError)
    throw new Error(`Error upserting slave: ${upsertError.message}`)
  }

  // Only log first registration, not subsequent updates
  if (!slaveId) {
    await supabaseClient
      .from('logs')
      .insert({
        level: 'info',
        source: 'system',
        message: `New slave registered: ${slaveName}`,
        details: {
          slaveId: effectiveSlaveId,
          hostname: data.hostname || 'Unknown',
          ip: data.ip || '0.0.0.0'
        }
      })
  }

  return new Response(JSON.stringify({ 
    success: true, 
    message: slaveId ? 'Status updated successfully' : 'New slave registered successfully',
    id: effectiveSlaveId, // Return the ID (especially important for new slaves)
    data: upsertedSlave
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  })
}

// Helper to check if a column exists in a table
async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  const { data, error } = await supabaseClient
    .rpc('check_column_exists', { 
      table_name: tableName, 
      column_name: columnName 
    })
  
  if (error) {
    console.error('Error checking column existence:', error)
    
    // Fall back to a direct query if the function doesn't exist
    try {
      // Try with a direct query to information_schema
      const { data: schemaData, error: schemaError } = await supabaseClient
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .eq('column_name', columnName)
        .maybeSingle()
      
      if (schemaError) {
        console.error('Error querying information_schema:', schemaError)
        return false
      }
      
      return schemaData !== null
    } catch (e) {
      console.error('Failed to check column existence:', e)
      return false
    }
  }
  
  return data === true
}

