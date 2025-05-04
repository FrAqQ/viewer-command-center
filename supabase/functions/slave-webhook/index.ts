
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
    console.log('Received webhook payload:', JSON.stringify(requestBody))

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

  // Check if the slave exists
  const { data: existingSlave, error: checkError } = await supabaseClient
    .from('slaves')
    .select('id')
    .eq('id', slaveId)
    .single()

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
    throw new Error(`Error checking slave existence: ${checkError.message}`)
  }

  let result
  
  // Update or insert slave
  if (existingSlave) {
    // Update existing slave
    const { data: updatedSlave, error: updateError } = await supabaseClient
      .from('slaves')
      .update({
        name: slaveName,
        status: status,
        last_seen: new Date().toISOString(),
        cpu: metrics?.cpu,
        ram: metrics?.ram,
        instances: metrics?.instances,
      })
      .eq('id', slaveId)
      .select()

    if (updateError) {
      throw new Error(`Error updating slave: ${updateError.message}`)
    }
    
    result = updatedSlave
  } else {
    // Insert new slave
    const { data: newSlave, error: insertError } = await supabaseClient
      .from('slaves')
      .insert({
        id: slaveId,
        name: slaveName,
        hostname: data.hostname || 'Unknown',
        ip: data.ip || '0.0.0.0',
        status: status,
        last_seen: new Date().toISOString(),
        cpu: metrics?.cpu || 0,
        ram: metrics?.ram || 0,
        instances: metrics?.instances || 0,
      })
      .select()

    if (insertError) {
      throw new Error(`Error inserting new slave: ${insertError.message}`)
    }
    
    result = newSlave
    
    // Log the new slave registration
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
    data: result
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

    // Check if viewer exists
    const { data: existingViewer } = await supabaseClient
      .from('viewers')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    let result
    
    if (existingViewer) {
      // Update existing viewer
      const { data: updatedViewer, error: updateError } = await supabaseClient
        .from('viewers')
        .update({
          slave_id: slaveId,
          status: status,
          error: error || null,
          ...(screenshot ? { screenshot } : {}),
        })
        .eq('id', id)
        .select()

      if (updateError) {
        console.error(`Error updating viewer ${id}:`, updateError)
        continue
      }
      
      result = updatedViewer
    } else {
      // Insert new viewer
      const { data: newViewer, error: insertError } = await supabaseClient
        .from('viewers')
        .insert({
          id,
          slave_id: slaveId,
          url,
          proxy,
          status,
          error: error || null,
          ...(screenshot ? { screenshot } : {}),
        })
        .select()

      if (insertError) {
        console.error(`Error inserting viewer ${id}:`, insertError)
        continue
      }
      
      result = newViewer
    }

    results.push(result)
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
