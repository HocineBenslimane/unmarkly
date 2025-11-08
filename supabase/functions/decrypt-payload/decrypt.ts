import * as crypto from 'node:crypto';

const ENCRYPTION_KEY = 'R93Yvjhjg3TimoBENpCuydvq47AQ5Rh';

export interface EncryptedPayload {
  encrypted: string;
  iv: string;
}

export const decryptPayload = (payload: EncryptedPayload): Record<string, unknown> => {
  try {
    const key = Buffer.from(ENCRYPTION_KEY, 'utf8');
    const iv = Buffer.from(payload.iv, 'hex');
    const encryptedData = Buffer.from(payload.encrypted, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const jsonString = decrypted.toString('utf8');
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
