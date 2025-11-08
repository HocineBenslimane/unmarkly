import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'R93Yvjhjg3TimoBENpCuydvq47AQ5Rh';

export interface EncryptedPayload {
  encrypted: string;
  iv: string;
}

export const encryptPayload = (data: Record<string, unknown>): EncryptedPayload => {
  try {
    const jsonString = JSON.stringify(data);

    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(jsonString, CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY), {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return {
      encrypted: encrypted.toString(),
      iv: iv.toString(),
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const decryptPayload = (encryptedData: string, iv: string): Record<string, unknown> => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY), {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
