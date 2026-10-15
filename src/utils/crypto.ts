/**
 * Bank-grade Cryptography Module for Agribank One Password
 * Standard: AES-256-GCM + PBKDF2 (SHA-256, 100,000 iterations)
 * 100% Offline, runs locally in the browser/Node runtime via Web Crypto API
 */

// Buffer / ArrayBuffer converters safe for browser & Node
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Derive a 256-bit encryption key from a master password & salt
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext with password (AES-256-GCM)
export async function encryptText(plaintext: string, masterKey: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(masterKey, salt);
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    enc.encode(plaintext)
  );

  // Pack: 16 bytes salt + 12 bytes IV + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return arrayBufferToBase64(combined);
}

// Decrypt ciphertext using masterKey
export async function decryptText(encryptedBase64: string, masterKey: string): Promise<string> {
  try {
    const data = base64ToArrayBuffer(encryptedBase64);
    if (data.length < 28) {
      throw new Error('Dữ liệu mã hóa không hợp lệ (độ dài quá ngắn)');
    }

    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const ciphertext = data.slice(28);

    const key = await deriveKey(masterKey, salt);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    throw new Error('Giải mã thất bại: Mật khẩu chính không chính xác hoặc dữ liệu bị hỏng.');
  }
}

// SHA-256 password hash with salt for user login verification
export async function hashUserPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const combined = enc.encode(`${salt}#AGRIBANK_ONE_PASS_2026#${password}`);
  const hash = await crypto.subtle.digest('SHA-256', combined);
  return arrayBufferToBase64(new Uint8Array(hash));
}

// Generate random salt
export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return arrayBufferToBase64(array);
}

// Password Generator adhering to Banking Security Policies
export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export function generateStrongPassword(options: PasswordGeneratorOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
}): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude easily confused I, O
  const lower = 'abcdefghijkmnpqrstuvwxyz'; // exclude l, o
  const numbers = '23456789'; // exclude 0, 1
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charPool = '';
  const mandatoryChars: string[] = [];

  if (options.includeUppercase) {
    charPool += upper;
    mandatoryChars.push(upper[Math.floor(Math.random() * upper.length)]);
  }
  if (options.includeLowercase) {
    charPool += lower;
    mandatoryChars.push(lower[Math.floor(Math.random() * lower.length)]);
  }
  if (options.includeNumbers) {
    charPool += numbers;
    mandatoryChars.push(numbers[Math.floor(Math.random() * numbers.length)]);
  }
  if (options.includeSymbols) {
    charPool += symbols;
    mandatoryChars.push(symbols[Math.floor(Math.random() * symbols.length)]);
  }

  if (charPool === '') {
    charPool = upper + lower + numbers;
  }

  const result: string[] = [...mandatoryChars];
  const remaining = Math.max(0, options.length - mandatoryChars.length);

  const randomValues = new Uint32Array(remaining);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < remaining; i++) {
    result.push(charPool[randomValues[i] % charPool.length]);
  }

  // Shuffle array using Fisher-Yates
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

// Check password strength according to Agribank IT Security guidelines
export function evaluatePasswordStrength(password: string): {
  score: number; // 0-100
  label: 'yếu' | 'trung_bình' | 'mạnh' | 'rất_mạnh';
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 20;
  if (password.length >= 16) score += 10;

  if (/[A-Z]/.test(password)) score += 15;
  else feedback.push('Cần thêm chữ hoa (A-Z)');

  if (/[a-z]/.test(password)) score += 15;
  else feedback.push('Cần thêm chữ thường (a-z)');

  if (/[0-9]/.test(password)) score += 10;
  else feedback.push('Cần thêm chữ số (0-9)');

  if (/[^A-Za-z0-9]/.test(password)) score += 10;
  else feedback.push('Cần thêm ký tự đặc biệt (!@#$...)');

  let label: 'yếu' | 'trung_bình' | 'mạnh' | 'rất_mạnh' = 'yếu';
  if (score >= 85) label = 'rất_mạnh';
  else if (score >= 65) label = 'mạnh';
  else if (score >= 45) label = 'trung_bình';

  return { score, label, feedback };
}
