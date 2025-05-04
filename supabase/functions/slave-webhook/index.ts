
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
    console.log('Received webhook payload type:', requestBody.type)

    // Handle different webhook types
    const { type, slaveId, slaveName, data } = requestBody

    // Common validation
    if (!slaveId) {
      throw new Error('Missing slaveId in request')
    }

    // Process based on webhook type
    switch (type) {
      case 'status_update':
        return await handleStatusUpdate(slaveId, slaveName, data)
      
      case 'viewer_update':
        return await handleViewerUpdate(slaveId, data)
      
      case 'log_entry':
        return await handleLogEntry(slaveId, data)
      
      case 'command_result':
        return await handleCommandResult(slaveId, data)
      
      case 'get_pending_commands':
        return await getPendingCommands(slaveId)
      
      default:
        throw new Error('Unknown webhook type')
    }
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

  // Use upsert with conflict target on id instead of checking existence first
  const { data: upsertedSlave, error: upsertError } = await supabaseClient
    .from('slaves')
    .upsert([{
      id: slaveId,
      name: slaveName,
      hostname: data.hostname || 'Unknown',
      ip: data.ip || '0.0.0.0',
      status: status,
      last_seen: new Date().toISOString(),
      cpu: metrics?.cpu || 0,
      ram: metrics?.ram || 0,
      instances: metrics?.instances || 0
    }], { 
      onConflict: 'id'  // Important: This ensures we update existing records
    })
    .select()

  if (upsertError) {
    throw new Error(`Error upserting slave: ${upsertError.message}`)
  }

  // Only log when a new slave is registered (not when updating)
  const { data: existingSlave } = await supabaseClient
    .from('slaves')
    .select('created_at')
    .eq('id', slaveId)
    .single()

  // If the created_at timestamp is very recent, this was likely a new insert
  if (existingSlave && new Date().getTime() - new Date(existingSlave.created_at).getTime() < 5000) {
    await supabaseClient
      .from('logs')
      .insert({
        level: 'info',
        source: 'system',
        message: `New slave registered: ${slaveName}`,
        details: {
          slaveId,
          hostname: data.hostname || 'Unknown',
          ip: data.ip || '0.0.0.0'
        }
      })
  }

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Status updated successfully',
    data: upsertedSlave
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  })
}

// Handler for viewer status updates
async function handleViewerUpdate(slaveId: string, data: any) {
  if (!data || !Array.isArray(data.viewers)) {
    throw new Error('Invalid data payload for viewer_update')
  }

  const { viewers } = data
  const results = []

  // Process each viewer
  for (const viewer of viewers) {
    const { id, url, proxy, status, error, screenshot } = viewer
    
    if (!id) {
      console.warn('Skipping viewer update with missing id')
      continue
    }

    // Check if the screenshot column exists
    const hasScreenshotColumn = await checkColumnExists('viewers', 'screenshot')

    // Use upsert with conflict target on id
    const upsertData: any = {
      id,
      slave_id: slaveId,
      url,
      proxy,
      status,
      error: error || null
    }
    
    // Only add screenshot if the column exists and screenshot is provided
    if (hasScreenshotColumn && screenshot) {
      upsertData.screenshot = screenshot
    }

    const { data: upsertedViewer, error: upsertError } = await supabaseClient
      .from('viewers')
      .upsert([upsertData], { 
        onConflict: 'id' 
      })
      .select()

    if (upsertError) {
      console.error(`Error upserting viewer ${id}:`, upsertError)
      continue
    }
    
    results.push(upsertedViewer)
  }

  return new Response(JSON.stringify({ 
    success: true, 
    message: `Processed ${results.length} viewer updates`,
    data: results
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

// Handler for log entries
async function handleLogEntry(slaveId: string, data: any) {
  if (!data || !data.message) {
    throw new Error('Invalid data payload for log_entry')
  }

  const { level = 'info', message, details = {} } = data

  // Add the log entry
  const { error } = await supabaseClient
    .from('logs')
    .insert({
      level,
      source: `slave:${slaveId}`,
      message,
      details: { ...details, slaveId }
    })

  if (error) {
    throw new Error(`Error inserting log entry: ${error.message}`)
  }

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Log entry recorded'
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  })
}

// Handler for command execution results
async function handleCommandResult(slaveId: string, data: any) {
  if (!data || !data.commandId) {
    throw new Error('Invalid data payload for command_result')
  }

  const { commandId, status, result } = data

  // Update command status
  const { error } = await supabaseClient
    .from('commands')
    .update({
      status: status,
      result: result || null
    })
    .eq('id', commandId)

  if (error) {
    throw new Error(`Error updating command status: ${error.message}`)
  }

  // Add log entry for command completion
  await supabaseClient
    .from('logs')
    .insert({
      level: status === 'executed' ? 'info' : 'error',
      source: `slave:${slaveId}`,
      message: `Command ${commandId} ${status}`,
      details: { commandId, result }
    })

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Command result recorded'
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  })
}

// Get pending commands for a slave
async function getPendingCommands(slaveId: string) {
  // Fetch pending commands for this slave or 'all' slaves
  const { data: commands, error } = await supabaseClient
    .from('commands')
    .select('*')
    .eq('status', 'pending')
    .or(`target.eq.${slaveId},target.eq.all`)
    .order('timestamp', { ascending: true })

  if (error) {
    throw new Error(`Error fetching pending commands: ${error.message}`)
  }

  return new Response(JSON.stringify({ 
    success: true, 
    data: commands || []
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  })
}
