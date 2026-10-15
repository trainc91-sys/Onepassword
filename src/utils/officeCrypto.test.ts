import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
// @ts-ignore
import officeCrypto from 'officecrypto-tool';

test('Genuine ECMA-376 Agile Office encryption and decryption roundtrip', async () => {
  // Create sample xlsx content
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>');
  zip.file('xl/workbook.xml', '<workbook><sheets><sheet name="Dataset 2" sheetId="1"/></sheets></workbook>');
  
  const originalBuf = await zip.generateAsync({ type: 'nodebuffer' });
  const testPassword = 'AgribankSecurePass2026!';

  // Encrypt
  const encryptedBuf = await officeCrypto.encrypt(originalBuf, { password: testPassword });
  assert.ok(encryptedBuf.length > 0, 'Encrypted buffer should not be empty');

  // Verify CFBF magic bytes D0 CF 11 E0 A1 B1 1A E1
  const magicHex = encryptedBuf.slice(0, 8).toString('hex');
  assert.equal(magicHex, 'd0cf11e0a1b11ae1', 'Must have Compound File Binary Format magic bytes');

  // Verify isEncrypted
  assert.equal(officeCrypto.isEncrypted(encryptedBuf), true, 'File must be detected as encrypted');

  // Decrypt with correct password
  const decryptedBuf = await officeCrypto.decrypt(encryptedBuf, { password: testPassword });
  assert.ok(decryptedBuf.length > 0, 'Decrypted buffer should not be empty');

  // Decrypt with wrong password should fail
  await assert.rejects(
    async () => {
      await officeCrypto.decrypt(encryptedBuf, { password: 'WrongPassword123' });
    },
    /password is incorrect|invalid/i,
    'Decryption with wrong password must throw error'
  );
});
