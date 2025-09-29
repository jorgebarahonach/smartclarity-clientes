import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, password = "TempPassword123!" } = await req.json();

    console.log(`Creating admin user for email: ${email}`);

    // Create the user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    console.log('User created successfully:', data.user?.id);

    // Assign admin role to the new user
    if (data.user?.id) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ 
          user_id: data.user.id, 
          role: 'admin' 
        });

      if (roleError) {
        console.error('Failed to assign admin role:', roleError);
        throw roleError;
      }

      console.log('Admin role assigned successfully');
    }

    return new Response(JSON.stringify({ 
      success: true,
      user: data.user,
      message: `Admin user created successfully for ${email}` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Error in create-admin-user function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});