const _k1 = atob('UjkzWXZoamdnM1RpbW9CRU5wQ3V5ZHZxNDdBUTVSaA==');
const _k2 = 'h5R47AQ5Rq'.split('').reverse().join('');
const _k3 = String.fromCharCode(82, 57, 51, 89, 118, 104, 106, 103, 103, 51, 84);
const _k4 = btoa('TmBQdXlkdnE0N0FRNVJo').substring(0, 11);

function _reconstructKey(): string {
  const _obf1 = _k1.substring(0, 13);
  const _obf2 = _k2.substring(2, 8);
  const _obf3 = _k3.substring(0, 11);
  const _parts: string[] = [];

  for (let _i = 0; _i < _obf1.length; _i++) {
    _parts.push(_obf1[_i]);
  }

  _parts.push('y');
  _parts.push('d');
  _parts.push('v');

  const _combined = _parts.join('').slice(0, 20);
  const _final = _combined + 'q47AQ5Rh';

  return _final;
}

export interface EncryptedPayload {
  iv: string;
  ciphertext: string;
  salt: string;
  tag?: string;
  timestamp: number;
  nonce: string;
}

function _generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function _bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function _base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function _deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 10000,
      hash: 'SHA-256',
    },
    baseKey,
    256
  );

  return crypto.subtle.importKey(
    'raw',
    derivedBits,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptPayload(data: any): Promise<EncryptedPayload> {
  try {
    const secret = _reconstructKey();
    const iv = _generateRandomBytes(12);
    const salt = _generateRandomBytes(16);
    const nonce = _bytesToBase64(_generateRandomBytes(8)).substring(0, 16);

    const key = await _deriveKey(secret, salt);

    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(data));

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      plaintext
    );

    return {
      iv: _bytesToBase64(iv),
      ciphertext: _bytesToBase64(new Uint8Array(ciphertext)),
      salt: _bytesToBase64(salt),
      timestamp: Date.now(),
      nonce: nonce,
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function decryptPayload(encrypted: EncryptedPayload, secret?: string): Promise<any> {
  try {
    const key_secret = secret || _reconstructKey();
    const iv = _base64ToBytes(encrypted.iv);
    const salt = _base64ToBytes(encrypted.salt);
    const ciphertext = _base64ToBytes(encrypted.ciphertext);

    const key = await _deriveKey(key_secret, salt);

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(plaintext));
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function generateNonce(): string {
  return _bytesToBase64(_generateRandomBytes(8)).substring(0, 16);
}

export function getTimestamp(): number {
  return Date.now();
}

function _validateRequestAge(timestamp: number, maxAgeMs: number = 300000): boolean {
  const age = Date.now() - timestamp;
  return age >= 0 && age <= maxAgeMs;
}

export function validateEncryptedRequest(payload: EncryptedPayload): { valid: boolean; reason?: string } {
  if (!_validateRequestAge(payload.timestamp)) {
    return { valid: false, reason: 'Request timestamp is invalid or expired' };
  }

  if (!payload.iv || !payload.ciphertext || !payload.salt || !payload.nonce) {
    return { valid: false, reason: 'Missing required encryption fields' };
  }

  return { valid: true };
}
