import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SupportEmailRequest {
  to: string;
  subject: string;
  company: string;
  fullName: string;
  email: string;
  phone: string;
  problem: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, company, fullName, email, phone, problem }: SupportEmailRequest = await req.json();

    // Send email to support
    const supportEmailResponse = await resend.emails.send({
      from: "SmartClarity Portal <noreply@smartclarity.com>",
      to: [to],
      subject: subject,
      html: `
        <h2>Nuevo Problema de Acceso - Portal SmartClarity</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Información del Usuario:</h3>
          <p><strong>Empresa:</strong> ${company}</p>
          <p><strong>Nombre y Apellido:</strong> ${fullName}</p>
          <p><strong>Correo:</strong> ${email}</p>
          <p><strong>Teléfono:</strong> ${phone}</p>
        </div>
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Descripción del Problema:</h3>
          <p>${problem}</p>
        </div>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Este email fue enviado desde el Portal de Clientes SmartClarity.<br>
          Por favor responda a este email para contactar directamente al usuario.
        </p>
      `,
    });

    console.log("Support email sent successfully:", supportEmailResponse);

    // Send confirmation email to user
    const confirmationEmailResponse = await resend.emails.send({
      from: "SmartClarity Portal <noreply@smartclarity.com>",
      to: [email],
      subject: "Hemos recibido su consulta - Portal SmartClarity",
      html: `
        <h2>Gracias por contactarnos</h2>
        <p>Estimado/a ${fullName},</p>
        <p>Hemos recibido su mensaje y nos pondremos en contacto con usted a la brevedad para resolver el problema de acceso a sus documentos.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Resumen de su consulta:</h3>
          <p><strong>Empresa:</strong> ${company}</p>
          <p><strong>Problema reportado:</strong> ${problem}</p>
        </div>
        
        <p>Nuestro equipo técnico revisará su caso y le proporcionará una solución en el menor tiempo posible.</p>
        
        <p>Saludos cordiales,<br><strong>Equipo SmartClarity</strong></p>
        
        <hr>
        <p style="color: #666; font-size: 12px;">
          Este es un email automático, por favor no responda a este mensaje.
        </p>
      `,
    });

    console.log("Confirmation email sent successfully:", confirmationEmailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      supportEmail: supportEmailResponse,
      confirmationEmail: confirmationEmailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-support-email function:", error);
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