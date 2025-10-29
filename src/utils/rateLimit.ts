import { FingerprintComponents } from './fingerprint';

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  message?: string;
  blocked: boolean;
}

let pageLoadTime = Date.now();

export function initializePageLoadTime() {
  pageLoadTime = Date.now();
}

export async function checkRateLimit(fingerprint: string, components?: FingerprintComponents): Promise<RateLimitStatus> {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-rate-limit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ fingerprint, components }),
  });

  if (!response.ok) {
    throw new Error('Failed to check rate limit');
  }

  return response.json();
}

export async function trackBehavioralSignal(fingerprint: string, signal: string, metadata?: Record<string, unknown>) {
  try {
    const timeOnPage = Date.now() - pageLoadTime;
    
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-behavior`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        fingerprint,
        signal,
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
