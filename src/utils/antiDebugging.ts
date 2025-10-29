export interface AntiDebuggingConfig {
  enabled?: boolean;
  onDebugDetected?: () => void;
}

class AntiDebugging {
  private enabled: boolean;
  private onDebugDetected?: () => void;

  constructor(config: AntiDebuggingConfig = {}) {
    this.enabled = config.enabled !== false;
    this.onDebugDetected = config.onDebugDetected;
  }

  public start(): void {
    if (!this.enabled) return;
  }

  public stop(): void {
  }
}

export const createAntiDebugging = (config?: AntiDebuggingConfig): AntiDebugging => {
  return new AntiDebugging(config);
};

export const initAntiDebugging = (onDebugDetected?: () => void): AntiDebugging => {
  const isDevelopment = import.meta.env.DEV;

  const antiDebug = createAntiDebugging({
    enabled: !isDevelopment,
    onDebugDetected
  });

  if (!isDevelopment) {
    antiDebug.start();
  }

  return antiDebug;
};
