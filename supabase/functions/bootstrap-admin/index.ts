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
    const { email, password, firstName, lastName, role = 'admin', bootstrapSecret } = await req.json();

    // SECURITY: Require bootstrap secret for this sensitive operation
    const expectedSecret = Deno.env.get("BOOTSTRAP_SECRET");
    if (!expectedSecret) {
      console.error("BOOTSTRAP_SECRET not configured");
      return new Response(JSON.stringify({ error: "Bootstrap not configured. Please set BOOTSTRAP_SECRET in Edge Function secrets." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!bootstrapSecret || bootstrapSecret !== expectedSecret) {
      console.warn("Unauthorized bootstrap attempt");
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid bootstrap secret" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Input validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!password || password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Try to find existing user by email
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = usersList.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase());

    let userId: string | null = null;

    if (existingUser) {
      userId = existingUser.id;
      // Update password and metadata for existing user
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: { firstName, lastName }
      });
      if (updateError) throw updateError;
      console.log(`Updated existing user: ${email}`);
    } else {
      // Create user in auth.users
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { firstName, lastName }
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');
      userId = authData.user.id;
      console.log(`Created new user: ${email}`);
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

    console.log(`Bootstrap completed for ${email} with role ${role}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: existingUser ? `Usuario ${email} actualizado y rol ${role} asignado` : `Usuario ${email} creado con rol ${role}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Bootstrap error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
