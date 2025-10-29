export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  blocked?: boolean;
  message?: string;
}

let pageLoadTime: number = Date.now();

export function initializePageLoadTime(): void {
  pageLoadTime = Date.now();
}

export function getPageLoadTime(): number {
  return pageLoadTime;
}

export async function checkRateLimit(fingerprint: string, components?: { hardware: string; canvas: string; webgl: string }): Promise<RateLimitStatus> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-rate-limit`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fingerprint, components: components || { hardware: '', canvas: '', webgl: '' } }),
    });

    if (!response.ok) {
      throw new Error('Failed to check rate limit');
    }

    return response.json();
  } catch (err) {
    console.error('Rate limit check error:', err);
    return {
      allowed: true,
      remaining: 3,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}

export async function trackBehavioralSignal(
  fingerprint: string,
  signalType: string,
  metadata?: Record<string, any>
): Promise<void> {
  const timeOnPage = Date.now() - pageLoadTime;

  try {
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/increment-rate-limit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fingerprint,
        signalType,
        timeOnPage,
        metadata,
      }),
    });
  } catch (err) {
    console.error('Failed to track behavioral signal:', err);
  }
}
