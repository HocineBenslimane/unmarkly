import FingerprintJS from '@fingerprintjs/fingerprintjs';

export interface FingerprintComponents {
  userAgent: string;
  language: string;
  colorDepth: number;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  screenResolution: string;
  availableScreenResolution: string;
  timezone: string;
  sessionStorage: boolean;
  localStorage: boolean;
  indexedDB: boolean;
  platform: string;
}

let fpInstance: any = null;

export const getFingerprint = async (): Promise<string> => {
  if (!fpInstance) {
    fpInstance = await FingerprintJS.load();
  }
  const result = await fpInstance.get();
  return result.visitorId;
};

export const getFingerprintComponents = async (): Promise<FingerprintComponents> => {
  if (!fpInstance) {
    fpInstance = await FingerprintJS.load();
  }

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    colorDepth: screen.colorDepth,
    deviceMemory: (navigator as any).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    screenResolution: `${screen.width}x${screen.height}`,
    availableScreenResolution: `${screen.availWidth}x${screen.availHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sessionStorage: !!window.sessionStorage,
    localStorage: !!window.localStorage,
    indexedDB: !!window.indexedDB,
    platform: navigator.platform,
  };
};
