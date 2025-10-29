export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  blocked: boolean;
  message?: string;
}

let pageLoadTime: number = Date.now();

export function initializePageLoadTime() {
  pageLoadTime = Date.now();
}

export async function checkRateLimit(fingerprint: string): Promise<RateLimitStatus> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-rate-limit`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fingerprint }),
  });

  if (!response.ok) {
    throw new Error('Failed to check rate limit');
  }

  return await response.json();
}

export async function trackBehavioralSignal(
  fingerprint: string,
  action: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const timeOnPage = Date.now() - pageLoadTime;

    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/increment-rate-limit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fingerprint,
        action,
        metadata: {
          ...metadata,
          timeOnPage,
        },
      }),
    });
  } catch (error) {
    console.error('Failed to track behavioral signal:', error);
  }
}
