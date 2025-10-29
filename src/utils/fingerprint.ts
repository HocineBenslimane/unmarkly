import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<any> | null = null;

// Generate a hash from a string
const hashString = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Get hardware-based signals
const getHardwareFingerprint = (): string => {
  const signals: string[] = [];

  // Screen hardware characteristics (more stable than resolution)
  signals.push(`${screen.width}x${screen.height}`);
  signals.push(`${screen.colorDepth}`);
  signals.push(`${window.devicePixelRatio}`);
  signals.push(`${screen.availWidth}x${screen.availHeight}`);

  // Hardware concurrency (CPU cores)
  signals.push(`${navigator.hardwareConcurrency || 0}`);

  // Memory (if available)
  const nav = navigator as any;
  if (nav.deviceMemory) {
    signals.push(`${nav.deviceMemory}`);
  }

  // Platform
  signals.push(navigator.platform);

  // Timezone (stable per device location)
  signals.push(`${new Date().getTimezoneOffset()}`);
  signals.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  return signals.join('|');
};

// Get browser storage persistence
const getStorageFingerprint = (): string => {
  try {
    // Try to get or create a persistent ID in localStorage
    const storageKey = '__device_id';
    let deviceId = localStorage.getItem(storageKey);

    if (!deviceId) {
      deviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem(storageKey, deviceId);
    }

    return deviceId;
  } catch {
    return 'storage-unavailable';
  }
};

// Get canvas fingerprint (stable across sessions)
const getCanvasFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    canvas.width = 200;
    canvas.height = 50;

    // Draw unique pattern
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Device-FP', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Device-FP', 4, 17);

    return canvas.toDataURL();
  } catch {
    return 'canvas-error';
  }
};

// Get WebGL fingerprint
const getWebGLFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as any;

    if (!gl) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return `${vendor}~${renderer}`;
    }

    return 'webgl-no-debug';
  } catch {
    return 'webgl-error';
  }
};

// Get audio context fingerprint
const getAudioFingerprint = (): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        resolve('no-audio');
        return;
      }

      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gainNode = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

      gainNode.gain.value = 0;
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(context.destination);

      scriptProcessor.onaudioprocess = (event) => {
        const output = event.outputBuffer.getChannelData(0);
        const hash = Array.from(output.slice(0, 30))
          .map(v => Math.abs(v).toFixed(10))
          .join('');

        oscillator.disconnect();
        scriptProcessor.disconnect();
        context.close();

        resolve(hash.substring(0, 50));
      };

      oscillator.start(0);

      // Timeout fallback
      setTimeout(() => {
        try {
          oscillator.disconnect();
          scriptProcessor.disconnect();
          context.close();
        } catch {}
        resolve('audio-timeout');
      }, 1000);
    } catch {
      resolve('audio-error');
    }
  });
};

// Get fonts fingerprint
const getFontsFingerprint = (): string => {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New',
    'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
    'Trebuchet MS', 'Impact'
  ];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'no-fonts';

  const detected: string[] = [];

  for (const font of testFonts) {
    let detected_flag = false;
    for (const baseFont of baseFonts) {
      ctx.font = `72px ${baseFont}`;
      const baseWidth = ctx.measureText('mmmmmmmmmmlli').width;

      ctx.font = `72px ${font}, ${baseFont}`;
      const testWidth = ctx.measureText('mmmmmmmmmmlli').width;

      if (baseWidth !== testWidth) {
        detected_flag = true;
        break;
      }
    }
    if (detected_flag) {
      detected.push(font);
    }
  }

  return detected.join(',');
};

export const getFingerprint = async (): Promise<string> => {
  try {
    // Layer 1: FingerprintJS (browser fingerprint)
    if (!fpPromise) {
      fpPromise = FingerprintJS.load();
    }
    const fp = await fpPromise;
    const result = await fp.get();
    const fpjsId = result.visitorId;

    // Layer 2: Hardware signals (stable across browsers on same device)
    const hardwareId = getHardwareFingerprint();

    // Layer 3: Storage persistence (survives incognito detection)
    const storageId = getStorageFingerprint();

    // Layer 4: Canvas fingerprint
    const canvasId = getCanvasFingerprint();

    // Layer 5: WebGL fingerprint
    const webglId = getWebGLFingerprint();

    // Layer 6: Audio fingerprint
    const audioId = await getAudioFingerprint();

    // Layer 7: Fonts fingerprint
    const fontsId = getFontsFingerprint();

    // Combine all layers into composite fingerprint
    const composite = [
      fpjsId,
      hardwareId,
      storageId,
      canvasId,
      webglId,
      audioId,
      fontsId
    ].join('||');

    // Hash the composite to create final fingerprint
    const finalFingerprint = await hashString(composite);

    // Store components for matching logic
    sessionStorage.setItem('__fp_components', JSON.stringify({
      fpjs: fpjsId,
      hardware: await hashString(hardwareId),
      storage: await hashString(storageId),
      canvas: await hashString(canvasId),
      webgl: await hashString(webglId),
      audio: await hashString(audioId),
      fonts: await hashString(fontsId)
    }));

    return finalFingerprint;
  } catch (error) {
    console.error('Fingerprinting error:', error);
    // Fallback to basic fingerprint
    return `fallback-${Date.now()}-${Math.random()}`;
  }
};

// Get individual component fingerprints for fuzzy matching
export const getFingerprintComponents = (): Record<string, string> | null => {
  try {
    const stored = sessionStorage.getItem('__fp_components');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};
