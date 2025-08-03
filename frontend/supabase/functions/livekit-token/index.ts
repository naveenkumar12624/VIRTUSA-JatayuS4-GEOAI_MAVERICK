import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { AccessToken } from 'https://esm.sh/livekit-server-sdk@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY')
    const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET')
    const LIVEKIT_URL = Deno.env.get('VITE_LIVEKIT_SERVER_URL')

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      throw new Error('Missing LiveKit configuration')
    }

    // Parse request body
    const { roomName, participantName, participantId } = await req.json()

    if (!roomName || !participantName) {
      throw new Error('Missing required parameters: roomName and participantName')
    }

    // Create access token
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantId || participantName,
      name: participantName,
    })

    // Grant permissions
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    // Generate JWT token
    const jwt = token.toJwt()

    return new Response(
      JSON.stringify({ 
        token: jwt,
        url: LIVEKIT_URL,
        roomName,
        participantName 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    )
  } catch (error) {
    console.error('Error generating LiveKit token:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate token' 
      }),
      {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    )
  }
})