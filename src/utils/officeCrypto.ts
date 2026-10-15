import JSZip from 'jszip';
import { encryptText, decryptText, arrayBufferToBase64, base64ToArrayBuffer } from './crypto';

export interface OfficeBatchResult {
  fileName: string;
  success: boolean;
  message: string;
  blob?: Blob;
  downloadName?: string;
}

/**
 * Encrypt a file into an Agribank AES-256 Secure Intranet File (.agripass)
 */
export async function encryptOfficeFile(file: File, password: string): Promise<Blob> {
  const fileBuffer = await file.arrayBuffer();
  const fileBase64 = arrayBufferToBase64(new Uint8Array(fileBuffer));
  
  // Create payload with metadata
  const payload = JSON.stringify({
    header: 'AGRIBANK_SECURE_OFFICE_V1',
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream',
    timestamp: new Date().toISOString(),
    data: fileBase64,
  });

  const encryptedData = await encryptText(payload, password);

  // Return as binary blob
  const encoder = new TextEncoder();
  const blob = new Blob([encoder.encode(encryptedData)], {
    type: 'application/octet-stream',
  });
  return blob;
}

/**
 * Decrypt an Agribank AES-256 Secure Intranet File back to original Office document
 */
export async function decryptOfficeFile(file: File, password: string): Promise<{ blob: Blob; originalName: string }> {
  const fileText = await file.text();
  const decryptedPayload = await decryptText(fileText.trim(), password);

  const parsed = JSON.parse(decryptedPayload);
  if (!parsed.header || !parsed.header.startsWith('AGRIBANK_SECURE_OFFICE')) {
    throw new Error('Định dạng tệp không phải gói mã hóa Agribank');
  }

  const rawBytes = base64ToArrayBuffer(parsed.data);
  const blob = new Blob([rawBytes as unknown as BlobPart], { type: parsed.mimeType });

  return {
    blob,
    originalName: parsed.originalName || file.name.replace(/\.(agripass|enc)$/i, ''),
  };
}

/**
 * Check if a file is an official Microsoft Office encrypted file (CFBF container)
 */
export async function isOfficeEncryptedFile(file: File): Promise<boolean> {
  try {
    const slice = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(slice);
    // Magic bytes for Compound File Binary Format: D0 CF 11 E0 A1 B1 1A E1
    const isCFBF = bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0 &&
                   bytes[4] === 0xA1 && bytes[5] === 0xB1 && bytes[6] === 0x1A && bytes[7] === 0xE1;
    if (isCFBF) return true;

    // Call server check API
    const buffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(new Uint8Array(buffer));
    const res = await fetch('/api/office/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileData: base64 }),
    });
    if (res.ok) {
      const data = await res.json();
      return !!data.isEncrypted;
    }
  } catch (e) {
    console.warn('Error checking file encryption:', e);
  }
  return false;
}

/**
 * Genuine Microsoft Office File Encryption (ECMA-376 Agile Encryption / MS-OFFCRYPTO)
 * This generates standard encrypted .xlsx and .docx files that Microsoft Excel and Word
 * strictly require password to open!
 */
export async function injectNativeOfficeLock(file: File, password: string): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const base64Data = arrayBufferToBase64(new Uint8Array(buffer));

  const response = await fetch('/api/office/encrypt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileData: base64Data,
      password: password,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi máy chủ mã hóa (${response.status})`);
  }

  const resJson = await response.json();
  if (!resJson.encryptedData) {
    throw new Error('Máy chủ không trả về dữ liệu tệp mã hóa');
  }

  const encryptedBytes = base64ToArrayBuffer(resJson.encryptedData);
  const mimeType = file.name.endsWith('.docx')
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  return new Blob([encryptedBytes as unknown as BlobPart], { type: mimeType });
}

/**
 * Remove Password & Decrypt Office Files (.docx / .xlsx)
 * Supports both genuine ECMA-376 Agile Encrypted files and XML protected files
 */
export async function removeNativeOfficeLock(file: File, password?: string): Promise<Blob> {
  // Check if file is encrypted with standard Office password
  const isEnc = await isOfficeEncryptedFile(file);

  if (isEnc) {
    if (!password) {
      throw new Error('Tệp này đã được đặt mật khẩu mở. Vui lòng nhập mật khẩu để giải mã.');
    }

    const buffer = await file.arrayBuffer();
    const base64Data = arrayBufferToBase64(new Uint8Array(buffer));

    const response = await fetch('/api/office/decrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileData: base64Data,
        password: password,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Lỗi máy chủ giải mã (${response.status})`);
    }

    const resJson = await response.json();
    const decryptedBytes = base64ToArrayBuffer(resJson.decryptedData);
    const mimeType = file.name.endsWith('.docx')
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    return new Blob([decryptedBytes as unknown as BlobPart], { type: mimeType });
  }

  // Fallback: If it's an unencrypted OpenXML zip with sheet/structure protection tags
  try {
    const zip = new JSZip();
    const content = await zip.loadAsync(file);

    const lowerName = file.name.toLowerCase();
    const isWord = lowerName.endsWith('.docx');
    const isExcel = lowerName.endsWith('.xlsx');

    if (isWord) {
      const settingsPath = 'word/settings.xml';
      if (content.files[settingsPath]) {
        let settingsXml = await content.files[settingsPath].async('string');
        settingsXml = settingsXml.replace(/<w:documentProtection[^>]*\/>/g, '');
        settingsXml = settingsXml.replace(/<w:documentProtection[^>]*>.*?<\/w:documentProtection>/g, '');
        zip.file(settingsPath, settingsXml);
      }
    } else if (isExcel) {
      const workbookPath = 'xl/workbook.xml';
      if (content.files[workbookPath]) {
        let wbXml = await content.files[workbookPath].async('string');
        wbXml = wbXml.replace(/<workbookProtection[^>]*\/>/g, '');
        wbXml = wbXml.replace(/<fileSharing[^>]*\/>/g, '');
        zip.file(workbookPath, wbXml);
      }

      const sheetFiles = Object.keys(content.files).filter(f => f.startsWith('xl/worksheets/sheet') && f.endsWith('.xml'));
      for (const sheetPath of sheetFiles) {
        let sheetXml = await content.files[sheetPath].async('string');
        sheetXml = sheetXml.replace(/<sheetProtection[^>]*\/>/g, '');
        zip.file(sheetPath, sheetXml);
      }
    }

    zip.remove('AGRIBANK_SECURITY_METADATA.txt');
    return await zip.generateAsync({ type: 'blob', mimeType: file.type });
  } catch {
    throw new Error('Tệp không phải định dạng Office hợp lệ hoặc mật khẩu không chính xác');
  }
}

/**
 * Create a combined zip package for downloading all processed batch files
 */
export async function createBatchDownloadZip(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const zip = new JSZip();
  for (const item of files) {
    zip.file(item.name, item.blob);
  }
  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
