export interface VideoQuality {
  url: string;
  quality: string;
  type: string;
  priority: number;
}

export interface RemoveWatermarkResponse {
  videos: VideoQuality[];
  message?: string;
}

export async function removeWatermark(soraUrl: string, fingerprint: string): Promise<RemoveWatermarkResponse> {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/remove-watermark`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ soraUrl, fingerprint }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove watermark');
  }

  return response.json();
}
