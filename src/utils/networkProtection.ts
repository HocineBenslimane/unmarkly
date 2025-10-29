export interface ProtectedRequestInit extends RequestInit {
  skipProtection?: boolean;
}

class NetworkProtection {
  private enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }
}

let networkProtectionInstance: NetworkProtection | null = null;

export const getNetworkProtection = (): NetworkProtection => {
  if (!networkProtectionInstance) {
    const isDevelopment = import.meta.env.DEV;
    networkProtectionInstance = new NetworkProtection(!isDevelopment);
  }
  return networkProtectionInstance;
};

export const initNetworkProtection = (): NetworkProtection => {
  const protection = getNetworkProtection();
  protection.enable();
  return protection;
};
