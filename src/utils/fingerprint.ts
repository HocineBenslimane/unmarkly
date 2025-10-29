import FingerprintJS from '@fingerprintjs/fingerprintjs';

export interface FingerprintComponents {
  hardware: string;
  canvas: string;
  webgl: string;
}

let fingerprintPromise: Promise<string> | null = null;
let componentsPromise: Promise<FingerprintComponents> | null = null;

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

export async function getFingerprintComponents(): Promise<FingerprintComponents> {
  if (!componentsPromise) {
    componentsPromise = (async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();

      const components = result.components;

      return {
        hardware: JSON.stringify({
          hardwareConcurrency: components.hardwareConcurrency?.value,
          deviceMemory: components.deviceMemory?.value,
          platform: components.platform?.value,
        }),
        canvas: JSON.stringify(components.canvas?.value || {}),
        webgl: JSON.stringify(components.webgl?.value || {}),
      };
    })();
  }

  return componentsPromise;
}
