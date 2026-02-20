import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { answers, result, timestamp, source } = await req.json();

    if (!answers || !result) {
      console.error("[log-quiz] Missing required fields", { answers, result });
      return new Response(JSON.stringify({ success: false, error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const webhookUrl = Deno.env.get('GOOGLE_SHEETS_WEBHOOK_URL');
    if (!webhookUrl) {
      console.error("[log-quiz] GOOGLE_SHEETS_WEBHOOK_URL not configured");
      return new Response(JSON.stringify({ success: false, error: "Webhook not configured" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("[log-quiz] Forwarding to Google Sheets", { answersCount: answers.length, result, timestamp, source });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, result, timestamp, source: source || 'unknown' }),
    });

    const responseText = await response.text();
    console.log("[log-quiz] Google Sheets response:", response.status, responseText);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("[log-quiz] Error:", error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
