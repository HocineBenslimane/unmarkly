export interface SecurityConfig {
  disableRightClick?: boolean;
  disableKeyboardShortcuts?: boolean;
  disableTextSelection?: boolean;
  disableCopy?: boolean;
  onSecurityViolation?: (type: string) => void;
  enabled?: boolean;
}

class SecurityProtection {
  private config: SecurityConfig;
  private blockedKeys = new Set<string>();

  constructor(config: SecurityConfig = {}) {
    this.config = {
      disableRightClick: true,
      disableKeyboardShortcuts: true,
      disableTextSelection: true,
      disableCopy: true,
      enabled: true,
      ...config
    };

    this.initBlockedKeys();
  }

  private initBlockedKeys(): void {
    this.blockedKeys.add('F12');
    this.blockedKeys.add('I');
    this.blockedKeys.add('J');
    this.blockedKeys.add('U');
    this.blockedKeys.add('C');
    this.blockedKeys.add('S');
  }

  private handleContextMenu = (e: MouseEvent): void => {
    if (this.config.disableRightClick && this.config.enabled) {
      e.preventDefault();
      this.config.onSecurityViolation?.('context_menu');
      return;
    }
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.config.enabled) return;

    if (e.key === 'F12') {
      e.preventDefault();
      this.config.onSecurityViolation?.('f12_key');
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

    if (this.config.disableKeyboardShortcuts) {
      if (ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        this.config.onSecurityViolation?.('inspect_shortcut');
        return;
      }

      if (ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        this.config.onSecurityViolation?.('console_shortcut');
        return;
      }

      if (ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        this.config.onSecurityViolation?.('inspect_element_shortcut');
        return;
      }

      if (ctrlKey && e.key === 'U') {
        e.preventDefault();
        this.config.onSecurityViolation?.('view_source');
        return;
      }

      if (ctrlKey && e.key === 's') {
        e.preventDefault();
        this.config.onSecurityViolation?.('save_page');
        return;
      }

      if (isMac && e.metaKey && e.altKey && e.key === 'I') {
        e.preventDefault();
        this.config.onSecurityViolation?.('inspect_shortcut_mac');
        return;
      }

      if (isMac && e.metaKey && e.altKey && e.key === 'J') {
        e.preventDefault();
        this.config.onSecurityViolation?.('console_shortcut_mac');
        return;
      }

      if (isMac && e.metaKey && e.altKey && e.key === 'U') {
        e.preventDefault();
        this.config.onSecurityViolation?.('view_source_mac');
        return;
      }
    }

    if (this.config.disableCopy) {
      if (ctrlKey && e.key === 'c') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          this.config.onSecurityViolation?.('copy_attempt');
          return;
        }
      }
    }
  };

  private handleCopy = (e: ClipboardEvent): void => {
    if (!this.config.enabled || !this.config.disableCopy) return;

    const target = e.target as HTMLElement;
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      this.config.onSecurityViolation?.('copy_event');
    }
  };

  private handleCut = (e: ClipboardEvent): void => {
    if (!this.config.enabled || !this.config.disableCopy) return;

    const target = e.target as HTMLElement;
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      this.config.onSecurityViolation?.('cut_event');
    }
  };

  private handleSelectStart = (e: Event): void => {
    if (!this.config.enabled || !this.config.disableTextSelection) return;

    const target = e.target as HTMLElement;
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  private handleDragStart = (e: DragEvent): void => {
    if (!this.config.enabled) return;

    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
      e.preventDefault();
      this.config.onSecurityViolation?.('drag_attempt');
    }
  };

  public enable(): void {
    if (!this.config.enabled) return;

    document.addEventListener('contextmenu', this.handleContextMenu);
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('copy', this.handleCopy);
    document.addEventListener('cut', this.handleCut);
    document.addEventListener('selectstart', this.handleSelectStart);
    document.addEventListener('dragstart', this.handleDragStart);
  }

  public disable(): void {
    document.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('copy', this.handleCopy);
    document.removeEventListener('cut', this.handleCut);
    document.removeEventListener('selectstart', this.handleSelectStart);
    document.removeEventListener('dragstart', this.handleDragStart);
  }
}

export const createSecurityProtection = (config?: SecurityConfig): SecurityProtection => {
  return new SecurityProtection(config);
};

export const initSecurityProtection = (onViolation?: (type: string) => void): SecurityProtection => {
  const isDevelopment = import.meta.env.DEV;

  const protection = createSecurityProtection({
    disableRightClick: true,
    disableKeyboardShortcuts: true,
    disableTextSelection: true,
    disableCopy: true,
    onSecurityViolation: onViolation,
    enabled: !isDevelopment
  });

  if (!isDevelopment) {
    protection.enable();
  }

  return protection;
};
