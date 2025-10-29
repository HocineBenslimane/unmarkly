export interface VideoQuality {
  url: string;
  quality: string;
  type: string;
  priority: number;
}

export async function removeWatermark(soraUrl: string, fingerprint: string): Promise<{ videos: VideoQuality[]; message?: string }> {
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
    const error = await response.json().catch(() => ({ error: 'Failed to process video' }));
    throw new Error(error.error || 'Failed to process video');
  }

  return response.json();
}
