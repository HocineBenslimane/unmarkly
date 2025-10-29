export interface VideoQuality {
  url: string;
  quality: string;
  type: string;
  priority: number;
}

interface ApiResponse {
  videos: VideoQuality[];
}

interface ApiError {
  error?: string;
  message?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_ENDPOINT = `${SUPABASE_URL}/functions/v1/remove-watermark`;
const API_TIMEOUT = 60000;

export async function removeWatermark(soraUrl: string, fingerprint: string): Promise<ApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ soraUrl, fingerprint }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
        errorData.message ||
        `Server error: ${response.status}`
      );
    }

    const data: ApiResponse = await response.json();

    if (!data.videos || !Array.isArray(data.videos) || data.videos.length === 0) {
      throw new Error('No video URLs received from server');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }

      if (error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }

      throw error;
    }

    throw new Error('An unexpected error occurred. Please try again.');
  }
}
