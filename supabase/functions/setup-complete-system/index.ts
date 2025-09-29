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

    const results = [];

    // 1. Get all companies
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('*');

    if (companiesError) throw companiesError;

    // 2. Get all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    // 3. For each company, ensure there's an auth user with proper role
    for (const company of companies) {
      const existingUser = authUsers.users.find(u => u.email === company.email);
      
      if (!existingUser) {
        // Create auth user for this company
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: company.email,
          password: '123456', // Default password
          email_confirm: true
        });

        if (createError) {
          results.push({ company: company.name, status: 'error', message: createError.message });
          continue;
        }

        // Assign client role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: newUser.user!.id,
            role: 'client'
          });

        if (roleError) {
          results.push({ company: company.name, status: 'partial', message: 'User created but role assignment failed' });
        } else {
          results.push({ company: company.name, status: 'success', message: 'User created with client role' });
        }
      } else {
        // Ensure user has client role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: existingUser.id,
            role: 'client'
          }, { onConflict: 'user_id' });

        if (roleError) {
          results.push({ company: company.name, status: 'error', message: 'Failed to assign role' });
        } else {
          results.push({ company: company.name, status: 'success', message: 'Role ensured' });
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'System setup completed',
      results: results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});