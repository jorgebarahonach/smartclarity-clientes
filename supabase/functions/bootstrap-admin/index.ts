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

    const { email, password, role = 'admin' } = await req.json();

    // Try to find existing user by email
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = usersList.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase());

    let userId: string | null = null;

    if (existingUser) {
      userId = existingUser.id;
      // Update password for existing user
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
      });
      if (updateError) throw updateError;
    } else {
      // Create user in auth.users
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');
      userId = authData.user.id;
    }

    // Upsert role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId!,
        role: role
      }, { onConflict: 'user_id,role' });

    if (roleError) {
      console.error('Error assigning admin role:', roleError);
      throw roleError;
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: existingUser ? `Usuario ${email} actualizado y rol ${role} asignado` : `Usuario ${email} creado con rol ${role}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});