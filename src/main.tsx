import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSecurityProtection } from './utils/securityProtection';
import { initAntiDebugging } from './utils/antiDebugging';
import { initNetworkProtection } from './utils/networkProtection';
import { getSecurityLogger } from './utils/securityLogger';
import { getFingerprint } from './utils/fingerprint';

const isDevelopment = import.meta.env.DEV;

if (!isDevelopment) {
  getFingerprint().then(fingerprint => {
    const logger = getSecurityLogger();

    initSecurityProtection((violationType) => {
      logger.logSecurityViolation(fingerprint, violationType as any);
    });

    initAntiDebugging(() => {
      logger.logSecurityViolation(fingerprint, 'debug_detected');
    });

    initNetworkProtection();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
