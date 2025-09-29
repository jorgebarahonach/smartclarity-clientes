import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// Removed npm:resend import due to build environment; using direct HTTP call
const resend = {
  emails: {
    send: async ({ from, to, subject, html }: { from: string; to: string[]; subject: string; html: string; }) => {
      const apiKey = Deno.env.get("RESEND_API_KEY");
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok) return { data: body } as any;
      return { error: body || { status: res.status } } as any;
    }
  }
};
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
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, code: "email_provider_missing_api_key", friendlyMessage: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const { to, subject, company, fullName, email, phone, problem }: SupportEmailRequest = await req.json();

    const fromAddress = Deno.env.get("RESEND_FROM") ?? "Lovable <onboarding@resend.dev>";

    // Send email to support
    const supportEmailResponse = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
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

    // Send confirmation email to user
    const confirmationEmailResponse = await resend.emails.send({
      from: fromAddress,
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

    const providerErrors = [supportEmailResponse?.error, confirmationEmailResponse?.error].filter(Boolean);

    if (providerErrors.length) {
      console.error("Resend provider error", providerErrors);
      const invalidKey = providerErrors.some((e: any) => `${e?.message || e?.name}`.toLowerCase().includes("api key"));
      return new Response(
        JSON.stringify({
          success: false,
          code: invalidKey ? "email_provider_invalid_api_key" : "email_provider_error",
          providerErrors,
          friendlyMessage: "Email provider error",
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: any) {
    console.error("Error in send-support-email function:", error);
    return new Response(
      JSON.stringify({ success: false, code: "unexpected_error", error: error?.message, friendlyMessage: "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
};

serve(handler);