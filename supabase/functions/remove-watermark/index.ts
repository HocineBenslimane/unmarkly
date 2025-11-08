import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import * as crypto from 'node:crypto';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SORA_API_ENDPOINT = "https://soraremove.com/api/sora/remove-watermark";
const ENCRYPTION_KEY = 'R93Yvjhjg3TimoBENpCuydvq47AQ5Rh';

const decryptPayload = (payload: { ciphertext: string; iv: string; salt: string }): Record<string, unknown> => {
  try {
    const pbkdf2 = crypto.pbkdf2Sync(ENCRYPTION_KEY, Buffer.from(payload.salt, 'hex'), 100, 32, 'sha256');

    const iv = Buffer.from(payload.iv, 'hex');
    const ciphertext = Buffer.from(payload.ciphertext, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-cbc', pbkdf2, iv);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const jsonString = decrypted.toString('utf8');
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const translateType = (chineseType: string): string => {
  const translations: Record<string, string> = {
    "CDN MP4路径": "CDN MP4 Path",
    "无水印路径": "No Watermark Path",
    "MP4路径": "MP4 Path",
    "直接路径": "Direct Path",
    "带水印路径（备用）": "With Watermark (Backup)",
  };

  return translations[chineseType] || chineseType;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const requestBody = await req.json();

    let soraUrl: string;
    let fingerprint: string;

    try {
      const decrypted = decryptPayload(requestBody);
      soraUrl = decrypted.soraUrl as string;
      fingerprint = decrypted.fingerprint as string;
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid encrypted payload" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!soraUrl || typeof soraUrl !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid request. soraUrl is required." }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!fingerprint || typeof fingerprint !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid request. fingerprint is required." }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const soraUrlPattern = /^https:\/\/sora\.chatgpt\.com\/p\/[a-zA-Z0-9_-]+/;
    if (!soraUrlPattern.test(soraUrl)) {
      return new Response(
        JSON.stringify({ error: "Invalid Sora URL format" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("Processing URL:", soraUrl);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                     req.headers.get('x-real-ip') ||
                     'unknown';

    const now = new Date().toISOString();

    // Get feature flags from database
    const { data: rateLimitEnabledFlag } = await supabase
      .from('feature_flags')
      .select('value')
      .eq('key', 'rate_limit_enabled')
      .maybeSingle();

    const { data: maxDownloadsFlag } = await supabase
      .from('feature_flags')
      .select('value')
      .eq('key', 'max_downloads_per_day')
      .maybeSingle();

    const rateLimitEnabled = rateLimitEnabledFlag?.value ?? true;
    const MAX_DOWNLOADS = maxDownloadsFlag?.value?.value ?? 3;

    await supabase.rpc('cleanup_expired_rate_limits');

    const { data: rateLimitData, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('fingerprint', fingerprint)
      .gte('reset_at', now)
      .maybeSingle();

    if (fetchError) {
      console.error('Rate limit fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to check rate limit' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Check rate limit only if rate limiting is enabled
    if (rateLimitEnabled && rateLimitData && rateLimitData.download_count >= MAX_DOWNLOADS) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. You have reached your limit of 3 downloads per 24 hours.',
          resetAt: rateLimitData.reset_at,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    try {
      const response = await fetch(SORA_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ soraUrl }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("API Response Status:", response.status);

      const data = await response.json();
      console.log("API Response Data:", JSON.stringify(data, null, 2));

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            error: data.error || data.message || "Failed to process video",
          }),
          {
            status: response.status,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      let videos: Array<{url: string, quality: string, type: string, priority: number}> = [];

      if (data.videoUrls && Array.isArray(data.videoUrls)) {
        videos = data.videoUrls
          .filter((item: any) => item.url && typeof item.url === 'string')
          .map((item: any) => ({
            url: item.url,
            quality: item.quality || 'high',
            type: translateType(item.type || 'Video'),
            priority: item.priority || 99,
          }))
          .sort((a, b) => a.priority - b.priority);
      } else if (data.urls && Array.isArray(data.urls)) {
        videos = data.urls
          .filter((url: string) => url && typeof url === 'string')
          .map((url: string, index: number) => ({
            url,
            quality: 'high',
            type: 'Video',
            priority: index + 1,
          }));
      } else if (data.url && typeof data.url === 'string') {
        videos = [{
          url: data.url,
          quality: data.quality || 'high',
          type: translateType(data.type || 'Video'),
          priority: 1,
        }];
      }

      if (videos.length === 0) {
        console.error("No URLs found in response:", data);
        return new Response(
          JSON.stringify({
            error: "Failed to extract video URLs from API response",
            debug: data,
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const normalizedData = {
        videos,
      };

      console.log("Returning normalized data:", normalizedData);

      const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      if (!rateLimitData) {
        const { error: insertError } = await supabase
          .from('rate_limits')
          .insert({
            fingerprint,
            ip_address: clientIp,
            download_count: 1,
            last_download_at: now,
            reset_at: resetAt,
          });

        if (insertError) {
          console.error('Rate limit insert error:', insertError);
        }
      } else {
        const { error: updateError } = await supabase
          .from('rate_limits')
          .update({
            download_count: rateLimitData.download_count + 1,
            last_download_at: now,
            ip_address: clientIp,
            updated_at: now,
          })
          .eq('id', rateLimitData.id);

        if (updateError) {
          console.error('Rate limit update error:', updateError);
        }
      }

      return new Response(JSON.stringify(normalizedData), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return new Response(
          JSON.stringify({ error: "Request timeout. Please try again." }),
          {
            status: 504,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      throw fetchError;
    }
  } catch (error) {
    console.error("Error processing request:", error);

    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred. Please try again.",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});