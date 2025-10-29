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
    throw new Error('Fingerprint components not available');
  }

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
    throw new Error('Failed to check rate limit');
  }

  return response.json();
};

export const incrementRateLimit = async (fingerprint: string): Promise<void> => {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/increment-rate-limit`;
  const components = getFingerprintComponents();
  const timeSincePageLoad = getTimeSincePageLoad();

  if (!components) {
    throw new Error('Fingerprint components not available');
  }

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
    throw new Error('Failed to increment rate limit');
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
