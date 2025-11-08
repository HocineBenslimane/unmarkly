import { FingerprintComponents } from './fingerprint';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let pageLoadTime = Date.now();

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  blocked: boolean;
  isLimitEnabled?: boolean;
  message?: string;
}

export const initializePageLoadTime = (): void => {
  pageLoadTime = Date.now();
};

export const trackBehavioralSignal = async (
  fingerprint: string,
  action: string,
  metadata?: Record<string, any>
): Promise<void> => {
  const timeOnPage = Date.now() - pageLoadTime;

  const signal = {
    fingerprint,
    action,
    metadata: {
      ...metadata,
      time_on_page: timeOnPage,
      timestamp: new Date().toISOString(),
    },
  };

  try {
    await fetch(`${supabaseUrl}/functions/v1/track-behavior`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(signal),
    });
  } catch (err) {
    console.error('Failed to track behavior:', err);
  }
};

export const checkRateLimit = async (
  fingerprint: string,
  components?: FingerprintComponents
): Promise<RateLimitStatus> => {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/check-rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ fingerprint, components }),
    });

    if (!response.ok) {
      throw new Error('Failed to check rate limit');
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Rate limit check error:', err);
    return {
      allowed: true,
      remaining: 3,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      blocked: false,
    };
  }
};
