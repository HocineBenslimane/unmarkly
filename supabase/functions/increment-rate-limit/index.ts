import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { fingerprint, components, timeSincePageLoad } = await req.json();

    if (!fingerprint || !components) {
      return new Response(
        JSON.stringify({ error: 'Fingerprint and components are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const now = new Date().toISOString();
    const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Log behavioral signal for this download action
    await supabase
      .from('behavioral_signals')
      .insert({
        fingerprint,
        ip_address: clientIp,
        action_type: 'download',
        time_since_page_load: timeSincePageLoad || 0,
        metadata: {
          user_agent: userAgent,
        },
      });

    const { data: rateLimitData, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('fingerprint', fingerprint)
      .gte('reset_at', now)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!rateLimitData) {
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          fingerprint,
          ip_address: clientIp,
          hardware_fingerprint: components.hardware,
          canvas_fingerprint: components.canvas,
          webgl_fingerprint: components.webgl,
          user_agent: userAgent,
          download_count: 1,
          last_download_at: now,
          reset_at: resetAt,
          suspicious_score: 0,
        });

      if (insertError) {
        throw insertError;
      }
    } else {
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({
          download_count: rateLimitData.download_count + 1,
          last_download_at: now,
          ip_address: clientIp,
          hardware_fingerprint: components.hardware,
          canvas_fingerprint: components.canvas,
          webgl_fingerprint: components.webgl,
          user_agent: userAgent,
          updated_at: now,
        })
        .eq('id', rateLimitData.id);

      if (updateError) {
        throw updateError;
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Increment rate limit error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});