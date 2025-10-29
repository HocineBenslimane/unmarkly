import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const MAX_DOWNLOADS = 3;
const SUSPICIOUS_THRESHOLD = 50;

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

    const { fingerprint, components } = await req.json();

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

    // Check if fingerprint is blocked
    const { data: blockedData } = await supabase
      .from('blocked_fingerprints')
      .select('*')
      .eq('fingerprint', fingerprint)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .maybeSingle();

    if (blockedData) {
      return new Response(
        JSON.stringify({
          allowed: false,
          remaining: 0,
          blocked: true,
          reason: blockedData.reason,
          message: 'Your access has been blocked due to suspicious activity.',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if hardware is blocked
    if (components.hardware) {
      const { data: hardwareBlocked } = await supabase
        .from('blocked_fingerprints')
        .select('*')
        .eq('hardware_fingerprint', components.hardware)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .maybeSingle();

      if (hardwareBlocked) {
        return new Response(
          JSON.stringify({
            allowed: false,
            remaining: 0,
            blocked: true,
            reason: hardwareBlocked.reason,
            message: 'Your device has been blocked due to suspicious activity.',
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    await supabase.rpc('cleanup_expired_rate_limits');

    // Update or create fingerprint history
    const { data: historyData } = await supabase
      .from('fingerprint_history')
      .select('*')
      .eq('fingerprint', fingerprint)
      .maybeSingle();

    if (historyData) {
      await supabase
        .from('fingerprint_history')
        .update({
          last_seen_at: now,
          visit_count: historyData.visit_count + 1,
          ip_address: clientIp,
          user_agent: userAgent,
        })
        .eq('id', historyData.id);
    } else {
      await supabase
        .from('fingerprint_history')
        .insert({
          fingerprint,
          hardware_fingerprint: components.hardware,
          canvas_fingerprint: components.canvas,
          webgl_fingerprint: components.webgl,
          ip_address: clientIp,
          user_agent: userAgent,
        });
    }

    // Find similar devices (potential bypass attempts)
    const { data: similarDevices } = await supabase.rpc('find_similar_devices', {
      p_hardware_fp: components.hardware,
      p_canvas_fp: components.canvas,
      p_webgl_fp: components.webgl,
      p_ip_address: clientIp,
    });

    // Check direct fingerprint match
    const { data: rateLimitData, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('fingerprint', fingerprint)
      .gte('reset_at', now)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    // Aggregate download count from similar devices
    let totalDownloads = rateLimitData?.download_count || 0;
    let highestSimilarity = 0;

    if (similarDevices && similarDevices.length > 0) {
      for (const device of similarDevices) {
        if (device.fingerprint !== fingerprint && device.similarity_score >= 60) {
          totalDownloads += device.download_count;
          highestSimilarity = Math.max(highestSimilarity, device.similarity_score);
        }
      }
    }

    // Calculate suspicious score
    const { data: suspiciousScore } = await supabase.rpc('calculate_suspicious_score', {
      p_fingerprint: fingerprint,
      p_ip_address: clientIp,
      p_hardware_fp: components.hardware,
    });

    const score = suspiciousScore || 0;

    // Auto-block if suspicious score is too high
    if (score >= SUSPICIOUS_THRESHOLD) {
      await supabase
        .from('blocked_fingerprints')
        .insert({
          fingerprint,
          hardware_fingerprint: components.hardware,
          ip_address: clientIp,
          reason: 'Automated abuse detection',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          is_permanent: false,
        });

      return new Response(
        JSON.stringify({
          allowed: false,
          remaining: 0,
          blocked: true,
          message: 'Suspicious activity detected. Access temporarily blocked.',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update rate limit with enhanced data
    if (rateLimitData) {
      await supabase
        .from('rate_limits')
        .update({
          hardware_fingerprint: components.hardware,
          canvas_fingerprint: components.canvas,
          webgl_fingerprint: components.webgl,
          suspicious_score: score,
          user_agent: userAgent,
          ip_address: clientIp,
        })
        .eq('id', rateLimitData.id);
    }

    const remaining = MAX_DOWNLOADS - totalDownloads;
    const allowed = remaining > 0;

    return new Response(
      JSON.stringify({
        allowed,
        remaining: Math.max(0, remaining),
        resetAt: rateLimitData?.reset_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        suspiciousScore: score,
        similarDevicesDetected: highestSimilarity >= 60,
        message: allowed ? undefined : 'Rate limit exceeded. Please try again after the reset time.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Rate limit check error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});