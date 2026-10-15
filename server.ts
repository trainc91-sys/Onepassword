import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
// @ts-ignore
import officeCrypto from 'officecrypto-tool';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Support up to 100MB JSON & binary uploads for large Excel/Word sheets
  app.use(express.json({ limit: '100mb' }));
  app.use(express.raw({ limit: '100mb', type: ['application/octet-stream', 'application/vnd.openxmlformats-officedocument.*'] }));

  /**
   * Health check endpoint
   */
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  /**
   * Encrypt Office file (Excel .xlsx, Word .docx, PowerPoint .pptx)
   * Using genuine ECMA-376 Agile Encryption (AES-256)
   */
  app.post('/api/office/encrypt', async (req, res) => {
    try {
      let fileBuffer: Buffer;
      let password: string;
      let fileName: string = 'document.xlsx';

      if (req.body && req.body.fileData) {
        // Base64 payload
        fileBuffer = Buffer.from(req.body.fileData, 'base64');
        password = req.body.password;
        if (req.body.fileName) fileName = req.body.fileName;
      } else if (Buffer.isBuffer(req.body)) {
        // Raw binary body
        fileBuffer = req.body;
        password = (req.headers['x-password'] as string) || '';
        if (req.headers['x-filename']) {
          fileName = decodeURIComponent(req.headers['x-filename'] as string);
        }
      } else {
        return res.status(400).json({ error: 'Dữ liệu tệp không hợp lệ' });
      }

      if (!password) {
        return res.status(400).json({ error: 'Mật khẩu không được để trống' });
      }

      // Check if file is valid buffer
      if (!fileBuffer || fileBuffer.length === 0) {
        return res.status(400).json({ error: 'Tệp rỗng hoặc không có dữ liệu' });
      }

      // Perform genuine ECMA-376 Agile Encryption
      const encryptedBuffer = await officeCrypto.encrypt(fileBuffer, { password });

      // Verify encryption
      const isEncrypted = officeCrypto.isEncrypted(encryptedBuffer);

      if (req.query.format === 'binary') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        res.setHeader('X-Is-Encrypted', String(isEncrypted));
        return res.send(encryptedBuffer);
      }

      res.json({
        success: true,
        fileName,
        isEncrypted,
        encryptedData: encryptedBuffer.toString('base64'),
        size: encryptedBuffer.length,
        message: 'Đã mã hóa chuẩn ECMA-376 Agile (AES-256) thành công. Microsoft Excel/Word sẽ yêu cầu mật khẩu khi mở.',
      });
    } catch (error: any) {
      console.error('Office encrypt error:', error);
      res.status(500).json({
        error: error.message || 'Lỗi khi mã hóa tệp Office',
      });
    }
  });

  /**
   * Decrypt Office file
   */
  app.post('/api/office/decrypt', async (req, res) => {
    try {
      let fileBuffer: Buffer;
      let password: string;
      let fileName: string = 'document.xlsx';

      if (req.body && req.body.fileData) {
        fileBuffer = Buffer.from(req.body.fileData, 'base64');
        password = req.body.password;
        if (req.body.fileName) fileName = req.body.fileName;
      } else if (Buffer.isBuffer(req.body)) {
        fileBuffer = req.body;
        password = (req.headers['x-password'] as string) || '';
        if (req.headers['x-filename']) {
          fileName = decodeURIComponent(req.headers['x-filename'] as string);
        }
      } else {
        return res.status(400).json({ error: 'Dữ liệu tệp không hợp lệ' });
      }

      if (!password) {
        return res.status(400).json({ error: 'Vui lòng cung cấp mật khẩu để giải mã' });
      }

      // Check if file is encrypted
      const isEnc = officeCrypto.isEncrypted(fileBuffer);
      if (!isEnc) {
        return res.status(400).json({ error: 'Tệp này không được mã hóa mật khẩu Office' });
      }

      // Perform decryption
      const decryptedBuffer = await officeCrypto.decrypt(fileBuffer, { password });

      if (req.query.format === 'binary') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        return res.send(decryptedBuffer);
      }

      res.json({
        success: true,
        fileName,
        decryptedData: decryptedBuffer.toString('base64'),
        size: decryptedBuffer.length,
        message: 'Giải mã thành công. Đã gỡ bỏ mật khẩu bảo vệ.',
      });
    } catch (error: any) {
      console.error('Office decrypt error:', error);
      const isWrongPass = error.message && (
        error.message.includes('password is incorrect') || 
        error.message.includes('Invalid password') ||
        error.message.includes('verifier')
      );
      res.status(400).json({
        error: isWrongPass ? 'Sai mật khẩu mở tệp Office' : (error.message || 'Lỗi khi giải mã tệp Office'),
      });
    }
  });

  /**
   * Check if Office file is encrypted
   */
  app.post('/api/office/check', async (req, res) => {
    try {
      let fileBuffer: Buffer;
      if (req.body && req.body.fileData) {
        fileBuffer = Buffer.from(req.body.fileData, 'base64');
      } else if (Buffer.isBuffer(req.body)) {
        fileBuffer = req.body;
      } else {
        return res.status(400).json({ error: 'Dữ liệu tệp không hợp lệ' });
      }

      const isEnc = officeCrypto.isEncrypted(fileBuffer);
      res.json({ isEncrypted: isEnc });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mount Vite or static files
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`[Agribank Intranet Server] Running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
