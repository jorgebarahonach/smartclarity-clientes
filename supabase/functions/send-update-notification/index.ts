import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { companyId, documentName, isUrl, adminEmail }: UpdateNotificationRequest = await req.json();

    console.log('Processing update notification for company:', companyId);

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

    const adminEmails = adminUsers
      .filter(u => adminUserIds.includes(u.id))
      .map(u => u.email)
      .filter(Boolean) as string[];

    console.log('Sending notification to:', company.email);
    console.log('BCC to admins:', adminEmails);

    const documentType = isUrl ? 'URL' : 'Archivo';
    const portalLink = `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app') || 'https://smartclarity.lovable.app'}/dashboard`;

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
              <h2>Hola ${company.name},</h2>
              <p>Hemos actualizado su Portal de Cliente con lo siguiente:</p>
              <div class="update-item">
                <strong>• ${documentType}:</strong> ${documentName}
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
      from: `SmartClarity <${adminEmail}>`,
      to: [company.email],
      bcc: adminEmails,
      subject: "SmartClarity - Actualización de su Portal",
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-update-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
