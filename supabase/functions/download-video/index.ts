import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const videoUrl = url.searchParams.get("url");

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: "Video URL is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const response = await fetch(videoUrl);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch video" }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const blob = await response.blob();

    return new Response(blob, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "video/mp4",
        "Content-Disposition": "attachment; filename=sora-video.mp4",
      },
    });
  } catch (error) {
    console.error("Error proxying video:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to download video",
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