import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fingerprintPromise: Promise<string> | null = null;

export async function getFingerprint(): Promise<string> {
  if (!fingerprintPromise) {
    fingerprintPromise = (async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      return result.visitorId;
    })();
  }

  return fingerprintPromise;
}
