const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface VideoQuality {
  url: string;
  quality: string;
  type: string;
  priority: number;
}

export interface WatermarkResponse {
  videos: VideoQuality[];
  message?: string;
}

export const removeWatermark = async (
  soraUrl: string,
  fingerprint: string
): Promise<WatermarkResponse> => {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/remove-watermark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ soraUrl, fingerprint }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to remove watermark. Please try again.');
  }
};
