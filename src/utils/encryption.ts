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
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);

    const encrypted = CryptoJS.AES.encrypt(jsonString, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const ciphertext = encrypted.ciphertext.toString(CryptoJS.enc.Hex);

    return {
      encrypted: ciphertext,
      iv: iv.toString(CryptoJS.enc.Hex),
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const decryptPayload = (encryptedData: string, iv: string): Record<string, unknown> => {
  try {
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
    const ivWordArray = CryptoJS.enc.Hex.parse(iv);
    const ciphertext = CryptoJS.enc.Hex.parse(encryptedData);

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertext } as any,
      key,
      {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
