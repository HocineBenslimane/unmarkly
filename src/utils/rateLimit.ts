import { getFingerprintComponents } from './fingerprint';

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  message?: string;
  blocked?: boolean;
  suspiciousScore?: number;
  similarDevicesDetected?: boolean;
}

const MAX_DOWNLOADS = 3;
let pageLoadTime: number | null = null;

export const initializePageLoadTime = (): void => {
  pageLoadTime = Date.now();
};

const getTimeSincePageLoad = (): number => {
  if (!pageLoadTime) return 0;
  return Date.now() - pageLoadTime;
};

export const checkRateLimit = async (fingerprint: string): Promise<RateLimitStatus> => {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-rate-limit`;
  const components = getFingerprintComponents();

  if (!components) {
    console.warn('Fingerprint components not available yet, using fallback');
    return {
      allowed: true,
      remaining: MAX_DOWNLOADS,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fingerprint,
        components,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Rate limit check failed:', response.status, errorText);
      throw new Error(`Failed to check rate limit: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Rate limit check error:', error);
    throw error;
  }
};

export const incrementRateLimit = async (fingerprint: string): Promise<void> => {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/increment-rate-limit`;
  const components = getFingerprintComponents();
  const timeSincePageLoad = getTimeSincePageLoad();

  if (!components) {
    console.error('Fingerprint components not available for increment');
    throw new Error('Fingerprint components not available');
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fingerprint,
        components,
        timeSincePageLoad,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Increment rate limit failed:', response.status, errorText);
      throw new Error(`Failed to increment rate limit: ${response.status}`);
    }
  } catch (error) {
    console.error('Increment rate limit error:', error);
    throw error;
  }
};

export const getRemainingDownloads = (downloadCount: number): number => {
  return Math.max(0, MAX_DOWNLOADS - downloadCount);
};

export const trackBehavioralSignal = async (
  fingerprint: string,
  actionType: string,
  metadata?: Record<string, any>
): Promise<void> => {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-behavior`;
  const timeSincePageLoad = getTimeSincePageLoad();

  try {
    await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fingerprint,
        actionType,
        timeSincePageLoad,
        metadata,
      }),
    });
  } catch (error) {
    console.error('Failed to track behavioral signal:', error);
  }
};
