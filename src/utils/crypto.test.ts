import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptText,
  decryptText,
  hashUserPassword,
  generateStrongPassword,
  evaluatePasswordStrength,
} from './crypto.ts';

test('AES-256-GCM encryption and decryption roundtrip', async () => {
  const secretText = 'Agribank@CoreBanking#2026';
  const masterKey = 'IntranetAgribankMasterKey!';

  const encrypted = await encryptText(secretText, masterKey);
  assert.ok(typeof encrypted === 'string' && encrypted.length > 30, 'Encrypted output should be a base64 string');
  assert.notEqual(encrypted, secretText, 'Encrypted string must not match plaintext');

  const decrypted = await decryptText(encrypted, masterKey);
  assert.equal(decrypted, secretText, 'Decrypted text must match original secret');
});

test('Decryption fails with wrong master key', async () => {
  const secretText = 'Confidential_Data';
  const correctKey = 'CorrectKey123';
  const wrongKey = 'WrongKey999';

  const encrypted = await encryptText(secretText, correctKey);
  await assert.rejects(
    async () => {
      await decryptText(encrypted, wrongKey);
    },
    /Giải mã thất bại/
  );
});

test('Password hashing produces consistent salted digests', async () => {
  const password = 'Agribank@123';
  const salt = 'sample_salt_test';

  const hash1 = await hashUserPassword(password, salt);
  const hash2 = await hashUserPassword(password, salt);
  const hashDifferentSalt = await hashUserPassword(password, 'other_salt');

  assert.equal(hash1, hash2, 'Identical inputs must yield identical hash');
  assert.notEqual(hash1, hashDifferentSalt, 'Different salt must yield different hash');
});

test('Password generator adheres to strength constraints', () => {
  const pass = generateStrongPassword({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  });

  assert.equal(pass.length, 16, 'Generated password length must equal 16');
  assert.ok(/[A-Z]/.test(pass), 'Must contain uppercase');
  assert.ok(/[a-z]/.test(pass), 'Must contain lowercase');
  assert.ok(/[0-9]/.test(pass), 'Must contain number');

  const strength = evaluatePasswordStrength(pass);
  assert.ok(strength.score >= 80, 'Score should be high for 16-char mixed password');
});
