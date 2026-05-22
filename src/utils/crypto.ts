import CryptoJS from 'crypto-js';

const SECRET_KEY = 'ForestLawSecret'; // Should be replaced with a real key or managed securely

export function decryptData(encryptedStr: string): any {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedStr, SECRET_KEY);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

export function encryptData(data: any): string {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
}
