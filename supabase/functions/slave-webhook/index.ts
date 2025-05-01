
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const url = Deno.env.get('SUPABASE_URL') || ''
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Erstelle einen Supabase-Client mit der Service-Role für Administratorzugriff
    const supabase = createClient(url, key)
    
    // Extrahiere die Anforderungsdaten
    const data = await req.json()
    const action = data.action
    
    let result = null
    
    switch (action) {
      case 'register':
        // Registriere einen neuen Slave oder aktualisiere einen vorhandenen
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
            status: 'online',
            last_seen: new Date().toISOString(),
            cpu: slave.metrics?.cpu || 0,
            ram: slave.metrics?.ram || 0,
            instances: slave.metrics?.instances || 0
          })
          .select()
          .single()
        
        if (slaveError) throw slaveError
        result = { success: true, slave: slaveData }
        break
        
      case 'update':
        // Aktualisiere Slave-Metriken
        const metrics = data.metrics
        const slaveId = data.slaveId
        
        if (!slaveId) {
          throw new Error('Missing slave ID')
        }
        
        const { data: updateData, error: updateError } = await supabase
          .from('slaves')
          .update({
            last_seen: new Date().toISOString(),
            cpu: metrics?.cpu,
            ram: metrics?.ram,
            instances: metrics?.instances
          })
          .eq('id', slaveId)
          .select()
          .single()
        
        if (updateError) throw updateError
        result = { success: true, slave: updateData }
        break
        
      case 'fetch_commands':
        // Hole ausstehende Befehle für einen Slave ab
        const targetId = data.slaveId || data.hostname
        
        if (!targetId) {
          throw new Error('Missing slave ID or hostname')
        }
        
        const { data: commandData, error: commandError } = await supabase
          .from('commands')
          .select('*')
          .or(`target.eq.${targetId},target.eq.all`)
          .eq('status', 'pending')
        
        if (commandError) throw commandError
        result = { success: true, commands: commandData || [] }
        break
        
      case 'update_command':
        // Aktualisiere den Status eines Befehls
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
        result = { success: true, command: cmdUpdateData }
        break
        
      case 'add_log':
        // Füge einen neuen Log-Eintrag hinzu
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
        // Aktualisiere den Status einer Viewer-Instanz
        const viewerId = data.viewerId
        const viewerStatus = data.status
        const error = data.error
        
        if (!viewerId || !viewerStatus) {
          throw new Error('Missing viewer ID or status')
        }
        
        const { data: viewerUpdateData, error: viewerUpdateError } = await supabase
          .from('viewers')
          .update({
            status: viewerStatus,
            error: error || null
          })
          .eq('id', viewerId)
          .select()
          .single()
        
        if (viewerUpdateError) throw viewerUpdateError
        result = { success: true, viewer: viewerUpdateData }
        break
        
      default:
        throw new Error(`Unknown action: ${action}`)
    }
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in slave webhook:', error.message)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
