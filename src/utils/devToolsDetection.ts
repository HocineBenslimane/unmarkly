export interface DevToolsDetectionConfig {
  onDetected: () => void;
  checkInterval?: number;
  enabled?: boolean;
}

class DevToolsDetector {
  private enabled: boolean;
  private onDetected: () => void;

  constructor(config: DevToolsDetectionConfig) {
    this.onDetected = config.onDetected;
    this.enabled = config.enabled !== false;
  }

  public start(): void {
    if (!this.enabled) return;
  }

  public stop(): void {
  }
}

export const initDevToolsDetection = (onDetected: () => void): DevToolsDetector => {
  const isDevelopment = import.meta.env.DEV;

  const detector = new DevToolsDetector({
    onDetected,
    checkInterval: 1000,
    enabled: !isDevelopment
  });

  if (!isDevelopment) {
    detector.start();
  }

  return detector;
};
