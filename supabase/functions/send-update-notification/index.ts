import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
// Sender address: set RESEND_FROM secret to a verified domain email in Resend.
// Falls back to onboarding@resend.dev for testing if not provided/verified.
const FROM_ADDRESS = Deno.env.get("RESEND_FROM") || "onboarding@resend.dev";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateNotificationRequest {
  companyId: string;
  documentName: string;
  isUrl: boolean;
  adminEmail: string;
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey || !supabaseAnonKey) {
      throw new Error('Missing Supabase credentials');
    }

    // 1. Check for Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Verify user is authenticated
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Verify user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { companyId, documentName, isUrl, adminEmail }: UpdateNotificationRequest = await req.json();

    // Input validation
    if (!companyId || typeof companyId !== 'string') {
      return new Response(JSON.stringify({ error: "Invalid companyId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!documentName || typeof documentName !== 'string' || documentName.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid documentName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing update notification for company: ${companyId} by admin: ${user.email}`);

    // Obtener el email del cliente de la empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('email, name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('Error fetching company:', companyError);
      throw new Error('Company not found');
    }

    if (!company.email) {
      throw new Error('Company email is missing');
    }

    // Obtener emails de todos los administradores para CCO
    const { data: adminRoles, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Error fetching admin roles:', adminError);
      throw new Error('Error fetching admins');
    }

    // Obtener emails de los usuarios admin desde auth.users
    const adminUserIds = adminRoles?.map(r => r.user_id) || [];
    const { data: { users: adminUsers }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching admin users:', usersError);
      throw new Error('Error fetching admin users');
    }

    const adminEmails = (adminUsers || [])
      .filter(u => adminUserIds.includes(u.id))
      .map(u => u.email)
      .filter(Boolean) as string[];

    console.log('Sending notification to:', company.email);
    console.log('BCC to admins:', adminEmails);
    console.log('Using FROM address:', FROM_ADDRESS);

    const documentType = isUrl ? 'URL' : 'Archivo';
    const portalLink = `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app') || 'https://smartclarity.lovable.app'}/dashboard`;

    // Escape documentName and company.name to prevent XSS
    const safeDocumentName = escapeHtml(documentName);
    const safeCompanyName = escapeHtml(company.name);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .update-item { padding: 10px; margin: 10px 0; background: white; border-left: 4px solid #4CAF50; }
            .cta-button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SmartClarity</h1>
            </div>
            <div class="content">
              <h2>Hola ${safeCompanyName},</h2>
              <p>Hemos actualizado su Portal de Cliente con lo siguiente:</p>
              <div class="update-item">
                <strong>• ${documentType}:</strong> ${safeDocumentName}
              </div>
              <p style="text-align: center;">
                <a href="${portalLink}" class="cta-button">Ir al Portal de Cliente</a>
              </p>
              <p>El documento se encuentra disponible en la sección "Información & archivos estratégicos".</p>
            </div>
            <div class="footer">
              <p><strong>Equipo de SmartClarity</strong></p>
              <p>Este es un correo automático, por favor no responder.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: `SmartClarity <${FROM_ADDRESS}>`,
      to: [company.email],
      bcc: adminEmails,
      reply_to: adminEmail || undefined,
      subject: "SmartClarity - Actualización de su Portal",
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      throw new Error(emailResponse.error.message || 'Error sending email');
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-update-notification function: ", error?.message || error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
