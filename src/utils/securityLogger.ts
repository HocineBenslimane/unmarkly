import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type SecurityEventType =
  | 'devtools_detected'
  | 'context_menu'
  | 'f12_key'
  | 'inspect_shortcut'
  | 'console_shortcut'
  | 'view_source'
  | 'copy_attempt'
  | 'debug_detected'
  | 'inspect_element_shortcut'
  | 'save_page'
  | 'cut_event'
  | 'copy_event'
  | 'drag_attempt';

class SecurityLogger {
  private enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  public async logEvent(
    fingerprint: string,
    eventType: SecurityEventType,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      await supabase.from('security_events').insert({
        fingerprint,
        event_type: eventType,
        metadata,
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Security logging error:', err);
    }
  }

  public async logDevToolsDetection(fingerprint: string): Promise<void> {
    await this.logEvent(fingerprint, 'devtools_detected', {
      screen_width: window.screen.width,
      screen_height: window.screen.height,
    });
  }

  public async logSecurityViolation(
    fingerprint: string,
    violationType: SecurityEventType,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent(fingerprint, violationType, details);
  }
}

let securityLoggerInstance: SecurityLogger | null = null;

export const getSecurityLogger = (): SecurityLogger => {
  if (!securityLoggerInstance) {
    const isDevelopment = import.meta.env.DEV;
    securityLoggerInstance = new SecurityLogger(!isDevelopment);
  }
  return securityLoggerInstance;
};
