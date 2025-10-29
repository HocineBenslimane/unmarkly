export interface VideoQuality {
  url: string;
  quality: string;
  type: string;
  priority: number;
}

interface RemoveWatermarkResponse {
  videos: VideoQuality[];
  message?: string;
}

export async function removeWatermark(
  soraUrl: string,
  fingerprint: string
): Promise<RemoveWatermarkResponse> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/remove-watermark`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: soraUrl, fingerprint }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to remove watermark');
  }

  const data = await response.json();
  return data;
}
