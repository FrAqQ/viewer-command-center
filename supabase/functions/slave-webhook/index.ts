
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for allowing cross-origin requests from slave servers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    const url = Deno.env.get('SUPABASE_URL') || ''
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Create a Supabase client with the service role for admin access
    const supabase = createClient(url, key)
    
    // Extract the request data
    const data = await req.json()
    const action = data.action
    
    let result = null
    
    switch (action) {
      case 'register':
        // Register a new slave or update an existing one
        const slave = data.slave
        if (!slave || !slave.hostname) {
          throw new Error('Invalid slave data')
        }
        
        const { data: slaveData, error: slaveError } = await supabase
          .from('slaves')
          .upsert({
            id: slave.id || undefined,
            name: slave.name,
            hostname: slave.hostname,
            ip: slave.ip,
            status: slave.status,
            last_seen: new Date().toISOString(),
            cpu: slave.metrics?.cpu || 0,
            ram: slave.metrics?.ram || 0,
            instances: slave.metrics?.instances || 0
          })
          .select()
          .single()
        
        if (slaveError) throw slaveError
        
        // Log the successful registration
        await supabase
          .from('logs')
          .insert({
            level: 'info',
            source: slave.hostname,
            message: `Slave server registered/updated: ${slave.name}`,
            details: { hostname: slave.hostname, ip: slave.ip }
          })
        
        result = { success: true, slave: slaveData }
        break
        
      case 'update':
        // Update slave metrics
        const metrics = data.metrics
        const slaveId = data.slaveId
        const hostname = data.hostname
        
        if (!slaveId && !hostname) {
          throw new Error('Missing slave ID or hostname')
        }
        
        let updateQuery = supabase
          .from('slaves')
          .update({
            last_seen: new Date().toISOString(),
            cpu: metrics?.cpu,
            ram: metrics?.ram,
            instances: metrics?.instances,
            status: 'online' // Always set to online when updating
          });
        
        // Query by ID if provided, otherwise by hostname
        if (slaveId) {
          updateQuery = updateQuery.eq('id', slaveId);
        } else {
          updateQuery = updateQuery.eq('hostname', hostname);
        }
        
        const { data: updateData, error: updateError } = await updateQuery
          .select()
          .single();
        
        if (updateError) throw updateError
        result = { success: true, slave: updateData }
        break
        
      case 'fetch_commands':
        // Fetch pending commands for a slave
        const targetId = data.slaveId
        const targetHostname = data.hostname
        
        if (!targetId && !targetHostname) {
          throw new Error('Missing slave ID or hostname')
        }
        
        let commandQuery = supabase
          .from('commands')
          .select('*')
          .eq('status', 'pending');
        
        // Add condition for target (by ID, hostname, or 'all')
        if (targetId) {
          commandQuery = commandQuery.or(`target.eq.${targetId},target.eq.all`);
        } else if (targetHostname) {
          commandQuery = commandQuery.or(`target.eq.${targetHostname},target.eq.all`);
        }
        
        const { data: commandData, error: commandError } = await commandQuery;
        
        if (commandError) throw commandError
        result = { success: true, commands: commandData || [] }
        break
        
      case 'update_command':
        // Update the status of a command
        const commandId = data.commandId
        const status = data.status
        const payload = data.payload
        
        if (!commandId || !status) {
          throw new Error('Missing command ID or status')
        }
        
        const { data: cmdUpdateData, error: cmdUpdateError } = await supabase
          .from('commands')
          .update({
            status,
            payload: payload || undefined
          })
          .eq('id', commandId)
          .select()
          .single()
        
        if (cmdUpdateError) throw cmdUpdateError
        
        // Log the command status update
        await supabase
          .from('logs')
          .insert({
            level: status === 'executed' ? 'info' : 'error',
            source: 'Command Processor',
            message: `Command ${commandId} ${status}`,
            details: { commandId, payload }
          })
        
        result = { success: true, command: cmdUpdateData }
        break
        
      case 'add_log':
        // Add a new log entry
        const log = data.log
        
        if (!log || !log.level || !log.message) {
          throw new Error('Invalid log data')
        }
        
        const { data: logData, error: logError } = await supabase
          .from('logs')
          .insert({
            level: log.level,
            source: log.source,
            message: log.message,
            details: log.details || undefined
          })
          .select()
          .single()
        
        if (logError) throw logError
        result = { success: true, log: logData }
        break
      
      case 'update_viewer':
        // Update the status of a viewer instance
        const viewerId = data.viewerId
        const viewerStatus = data.status
        const error = data.error
        const url = data.url
        const slaveHostname = data.slaveHostname
        
        // Find the slave ID if hostname is provided
        let slaveHostnameId = null
        if (slaveHostname && !data.slaveId) {
          const { data: slaveByHostname } = await supabase
            .from('slaves')
            .select('id')
            .eq('hostname', slaveHostname)
            .single();
          
          if (slaveByHostname) {
            slaveHostnameId = slaveByHostname.id;
          }
        }
        
        if (viewerId) {
          // Update existing viewer
          if (!viewerStatus) {
            throw new Error('Missing viewer status')
          }
          
          const { data: viewerUpdateData, error: viewerUpdateError } = await supabase
            .from('viewers')
            .update({
              status: viewerStatus,
              error: error || null,
              slave_id: data.slaveId || slaveHostnameId || undefined
            })
            .eq('id', viewerId)
            .select()
            .single()
          
          if (viewerUpdateError) throw viewerUpdateError
          result = { success: true, viewer: viewerUpdateData }
        } else if (url) {
          // Create new viewer instance
          const { data: newViewer, error: newViewerError } = await supabase
            .from('viewers')
            .insert({
              url,
              slave_id: data.slaveId || slaveHostnameId || undefined,
              status: viewerStatus || 'running',
              error: error || null,
              proxy_id: data.proxyId || null
            })
            .select()
            .single()
          
          if (newViewerError) throw newViewerError
          
          // Log the new viewer
          await supabase
            .from('logs')
            .insert({
              level: 'info',
              source: slaveHostname || 'Slave',
              message: `New viewer started for ${url}`,
              details: { viewerId: newViewer.id }
            })
          
          result = { success: true, viewer: newViewer }
        } else {
          throw new Error('Either viewerId or url must be provided')
        }
        break

      case 'check_proxy':
        // Update proxy validity status
        const proxyId = data.proxyId
        const proxyValid = data.valid === true
        const proxyAddress = data.address
        const proxyPort = data.port
        
        let proxyQuery = supabase.from('proxies');
        
        if (proxyId) {
          // Update existing proxy
          const { data: proxyData, error: proxyError } = await proxyQuery
            .update({
              valid: proxyValid,
              last_checked: new Date().toISOString(),
              fail_count: proxyValid ? 0 : supabase.rpc('increment_fail_count', { proxy_id: proxyId })
            })
            .eq('id', proxyId)
            .select()
            .single();
          
          if (proxyError) throw proxyError
          result = { success: true, proxy: proxyData }
        } else if (proxyAddress && proxyPort) {
          // Find by address and port
          const { data: proxyData, error: proxyError } = await proxyQuery
            .update({
              valid: proxyValid,
              last_checked: new Date().toISOString(),
              fail_count: proxyValid ? 0 : supabase.rpc('increment_fail_count', { address: proxyAddress, port: proxyPort })
            })
            .eq('address', proxyAddress)
            .eq('port', proxyPort)
            .select()
            .single();
          
          if (proxyError) throw proxyError
          result = { success: true, proxy: proxyData }
        } else {
          throw new Error('Either proxyId or address+port must be provided')
        }
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`)
    }
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in slave webhook:', error.message)
    
    // Try to log the error to the database
    try {
      const url = Deno.env.get('SUPABASE_URL') || ''
      const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      const supabase = createClient(url, key)
      
      await supabase
        .from('logs')
        .insert({
          level: 'error',
          source: 'Webhook',
          message: `Error in slave webhook: ${error.message}`,
          details: { error: error.message }
        })
    } catch (logError) {
      // Silently fail if logging to database fails
      console.error('Failed to log error to database:', logError)
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
