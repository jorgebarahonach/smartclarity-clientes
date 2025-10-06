import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    // Parse request body to check if userId is provided
    const body = await req.json().catch(() => ({}))
    const { userId } = body

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    let user
    if (userId) {
      // Get specific user by ID (admin function)
      const { data, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
      
      if (userError || !data.user) {
        return new Response(
          JSON.stringify({ error: 'Failed to get user' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      user = data.user
    } else {
      // Get current authenticated user
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Missing authorization header' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: {
          headers: { Authorization: authHeader }
        }
      })

      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        return new Response(
          JSON.stringify({ error: 'Failed to get user' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      user = currentUser
    }

    // Get user role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    let role = 'client' // default role
    if (roleData && !roleError) {
      role = roleData.role
    }

    return new Response(
      JSON.stringify({ 
        email: user.email,
        user_metadata: user.user_metadata,
        role: role
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in admin-get-current-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})