const _k1 = 'UjkzWXZoamdnM1RpbW9CRU5wQ3V5ZHZxNDdBUTVSaA==';
const _k2 = 'h5R47AQ5Rq'.split('').reverse().join('');
const _k3 = String.fromCharCode(82, 57, 51, 89, 118, 104, 106, 103, 103, 51, 84);

function _reconstructKey(): string {
  const decoded = atob(_k1);
  const _obf1 = decoded.substring(0, 13);
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
      iterations: 100000,
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

export async function decryptPayload(encrypted: EncryptedPayload): Promise<any> {
  try {
    const secret = _reconstructKey();
    const iv = _base64ToBytes(encrypted.iv);
    const salt = _base64ToBytes(encrypted.salt);
    const ciphertext = _base64ToBytes(encrypted.ciphertext);

    const key = await _deriveKey(secret, salt);

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

export function validateRequestAge(timestamp: number, maxAgeMs: number = 300000): boolean {
  const currentTime = Date.now();
  const age = currentTime - timestamp;
  return age >= 0 && age <= maxAgeMs;
}

export async function checkAndRecordNonce(
  supabase: any,
  nonce: string,
  fingerprint: string
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const { data, error } = await supabase
      .from('request_nonces')
      .select('nonce')
      .eq('nonce', nonce)
      .maybeSingle();

    if (data) {
      return { valid: false, reason: 'Replay attack detected: nonce already used' };
    }

    const { error: insertError } = await supabase
      .from('request_nonces')
      .insert({
        nonce,
        fingerprint,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });

    if (insertError) {
      console.error('Failed to record nonce:', insertError);
      return { valid: false, reason: 'Failed to validate request' };
    }

    return { valid: true };
  } catch (err) {
    console.error('Nonce validation error:', err);
    return { valid: false, reason: 'Request validation failed' };
  }
}