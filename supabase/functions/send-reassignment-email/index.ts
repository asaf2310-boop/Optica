// Supabase Edge Function — send reassignment email via Resend
// Deploy: supabase functions deploy send-reassignment-email
// Secrets: RESEND_API_KEY, RESEND_FROM (e.g. "Optica <noreply@yourdomain.com>")

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("RESEND_FROM") ?? "Optica <onboarding@resend.dev>";

    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured on Edge Function" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to, subject, html, text } = await req.json();

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "to and subject are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html: html ?? undefined,
        text: text ?? undefined,
      }),
    });

    const body = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: body }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: body.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
