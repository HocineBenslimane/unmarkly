import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'R93Yvjhjg3TimoBENpCuydvq47AQ5Rh';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  salt: string;
}

export const encryptPayload = (data: Record<string, unknown>): EncryptedPayload => {
  try {
    const jsonString = JSON.stringify(data);
    const salt = CryptoJS.lib.WordArray.random(256 / 8);

    const key = CryptoJS.PBKDF2(ENCRYPTION_KEY, salt, {
      keySize: 256 / 32,
      iterations: 100,
    });

    const iv = CryptoJS.lib.WordArray.random(128 / 8);

    const encrypted = CryptoJS.AES.encrypt(jsonString, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return {
      ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
      iv: iv.toString(CryptoJS.enc.Hex),
      salt: salt.toString(CryptoJS.enc.Hex),
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
