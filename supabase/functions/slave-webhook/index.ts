
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Get the authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Parse the request body
    const body = await req.json();
    console.log("Received webhook from slave:", body);
    
    // Determine the action based on the endpoint
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    
    switch (path) {
      case 'heartbeat':
        // Update slave status
        if (!body.id) {
          return new Response(JSON.stringify({ error: 'Missing slave ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const { data: slaveData, error: slaveError } = await supabase
          .from('slaves')
          .update({
            status: body.status || 'online',
            last_seen: new Date().toISOString(),
            cpu: body.cpu,
            ram: body.ram,
            instances: body.instances
          })
          .eq('id', body.id)
          .select()
          .single();
        
        if (slaveError) {
          console.error("Error updating slave:", slaveError);
          return new Response(JSON.stringify({ error: slaveError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Log the heartbeat
        await supabase.from('logs').insert({
          level: 'info',
          source: `Slave-${body.id}`,
          message: `Heartbeat received from ${slaveData.name}`,
          details: {
            cpu: body.cpu,
            ram: body.ram,
            instances: body.instances
          }
        });
        
        return new Response(JSON.stringify({ success: true, data: slaveData }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      
      case 'register':
        // Register a new slave
        if (!body.name || !body.hostname || !body.ip) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const { data: newSlave, error: registerError } = await supabase
          .from('slaves')
          .insert({
            name: body.name,
            hostname: body.hostname,
            ip: body.ip,
            status: 'online',
            last_seen: new Date().toISOString(),
            cpu: 0,
            ram: 0,
            instances: 0
          })
          .select()
          .single();
        
        if (registerError) {
          console.error("Error registering slave:", registerError);
          return new Response(JSON.stringify({ error: registerError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Log the registration
        await supabase.from('logs').insert({
          level: 'info',
          source: 'Master',
          message: `New slave registered: ${body.name}`,
          details: {
            hostname: body.hostname,
            ip: body.ip,
            slaveId: newSlave.id
          }
        });
        
        return new Response(JSON.stringify({ success: true, data: newSlave }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      
      case 'viewer':
        // Handle viewer updates
        if (!body.action || !body.slaveId) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        if (body.action === 'start') {
          // Start a new viewer
          const { data: viewer, error: viewerError } = await supabase
            .from('viewers')
            .insert({
              slave_id: body.slaveId,
              url: body.url,
              status: 'running',
              start_time: new Date().toISOString()
            })
            .select()
            .single();
          
          if (viewerError) {
            console.error("Error starting viewer:", viewerError);
            return new Response(JSON.stringify({ error: viewerError.message }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Log the viewer start
          await supabase.from('logs').insert({
            level: 'info',
            source: `Slave-${body.slaveId}`,
            message: `New viewer started for ${body.url}`,
            details: {
              viewerId: viewer.id,
              url: body.url
            }
          });
          
          return new Response(JSON.stringify({ success: true, data: viewer }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else if (body.action === 'stop') {
          // Stop a viewer
          const { data: viewer, error: viewerError } = await supabase
            .from('viewers')
            .update({
              status: 'stopped'
            })
            .eq('id', body.viewerId)
            .select()
            .single();
          
          if (viewerError) {
            console.error("Error stopping viewer:", viewerError);
            return new Response(JSON.stringify({ error: viewerError.message }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Log the viewer stop
          await supabase.from('logs').insert({
            level: 'info',
            source: `Slave-${body.slaveId}`,
            message: `Viewer stopped for ${viewer.url}`,
            details: {
              viewerId: viewer.id
            }
          });
          
          return new Response(JSON.stringify({ success: true, data: viewer }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else if (body.action === 'error') {
          // Report a viewer error
          const { data: viewer, error: viewerError } = await supabase
            .from('viewers')
            .update({
              status: 'error',
              error: body.error
            })
            .eq('id', body.viewerId)
            .select()
            .single();
          
          if (viewerError) {
            console.error("Error updating viewer error:", viewerError);
            return new Response(JSON.stringify({ error: viewerError.message }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Log the viewer error
          await supabase.from('logs').insert({
            level: 'error',
            source: `Slave-${body.slaveId}`,
            message: `Viewer error: ${body.error || 'Unknown error'}`,
            details: {
              viewerId: viewer.id,
              url: viewer.url
            }
          });
          
          return new Response(JSON.stringify({ success: true, data: viewer }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
