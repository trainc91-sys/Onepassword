import React, { useState } from 'react';
import { getAccounts, saveAccounts, getMasterKey, addAuditLog } from '../utils/storage';
import { encryptText, decryptText } from '../utils/crypto';
import { VaultAccount } from '../types';
import { X, ShieldAlert, Download, Upload, CheckCircle2, AlertCircle, HardDriveDownload } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshAccounts: () => void;
  currentUser: { fullName: string; username: string; role: any; department: string };
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onRefreshAccounts,
  currentUser,
}) => {
  const [backupPassword, setBackupPassword] = useState('Agribank@2026');
  const [importPassword, setImportPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleExportBackup = async () => {
    if (!backupPassword.trim()) {
      alert('Vui lòng đặt mật khẩu bảo vệ cho gói sao lưu');
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const accounts = getAccounts();
      const payload = JSON.stringify({
        header: 'AGRIBANK_ONE_PASSWORD_ENCRYPTED_VAULT_V1',
        createdAt: new Date().toISOString(),
        exportedBy: currentUser.fullName,
        accountsCount: accounts.length,
        accounts,
      });

      const encrypted = await encryptText(payload, backupPassword);
      const blob = new Blob([encrypted], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Agribank_OnePassword_Backup_${new Date().toISOString().slice(0, 10)}.agripass`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: `Đã xuất gói sao lưu mã hóa an toàn thành công (${accounts.length} tài khoản)!`,
      });

      addAuditLog({
        userId: currentUser.username,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        department: currentUser.department,
        action: 'EXPORT_VAULT_BACKUP',
        resource: 'Encrypted Vault Backup Package',
        details: `Cán bộ xuất bản sao lưu bảo mật chứa ${accounts.length} tài khoản ứng dụng`,
        clientIp: '10.12.18.88',
        severity: 'high',
        isoStandardTag: 'ISO/IEC 27001 - A.10.1.1',
      });
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: `Lỗi xuất sao lưu: ${err instanceof Error ? err.message : 'Lỗi mã hóa'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportBackup = async () => {
    if (!selectedFile) {
      alert('Vui lòng chọn tệp sao lưu (.agripass)');
      return;
    }
    if (!importPassword.trim()) {
      alert('Vui lòng nhập mật khẩu giải mã gói sao lưu');
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const text = await selectedFile.text();
      const decrypted = await decryptText(text.trim(), importPassword);
      const parsed = JSON.parse(decrypted);

      if (!parsed.header || !parsed.header.startsWith('AGRIBANK_ONE_PASSWORD')) {
        throw new Error('Tệp không đúng định dạng sao lưu Agribank One Password');
      }

      if (!Array.isArray(parsed.accounts)) {
        throw new Error('Cấu trúc dữ liệu trong tệp sao lưu không hợp lệ');
      }

      // Merge or replace
      const currentAccounts = getAccounts();
      const incomingAccounts: VaultAccount[] = parsed.accounts;

      // Merge by appName & username
      const mergedMap = new Map<string, VaultAccount>();
      for (const a of currentAccounts) {
        mergedMap.set(`${a.appName}_${a.username}`, a);
      }
      for (const a of incomingAccounts) {
        mergedMap.set(`${a.appName}_${a.username}`, a);
      }

      const mergedList = Array.from(mergedMap.values());
      saveAccounts(mergedList);
      onRefreshAccounts();

      setMessage({
        type: 'success',
        text: `Đã khôi phục thành công! Tổng số tài khoản hiện tại: ${mergedList.length}.`,
      });

      addAuditLog({
        userId: currentUser.username,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        department: currentUser.department,
        action: 'IMPORT_VAULT_BACKUP',
        resource: selectedFile.name,
        details: `Khôi phục dữ liệu từ tệp sao lưu (${incomingAccounts.length} tài khoản nạp mới/cập nhật)`,
        clientIp: '10.12.18.88',
        severity: 'high',
        isoStandardTag: 'ISO/IEC 27001 - A.10.1.1',
      });
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: `Không thể khôi phục: ${err instanceof Error ? err.message : 'Sai mật khẩu hoặc tệp bị hỏng'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#005A2E] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#8C1D2F]">
          <div className="flex items-center gap-2">
            <HardDriveDownload className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-sm tracking-wide">
              SAO LƯU & KHÔI PHỤC KHO MẬT KHẨU MÃ HÓA (OFFLINE)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
          {message && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 font-medium ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Export Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Download className="w-4 h-4 text-[#005A2E]" />
              <span>1. XUẤT BẢN SAO LƯU MÃ HÓA (.AGRIPASS)</span>
            </div>
            <p className="text-slate-600">
              Đóng gói toàn bộ tài khoản vào tệp được mã hóa AES-256 để lưu trữ an toàn trên USB hoặc phân vùng sao lưu máy trạm.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Đặt mật khẩu khóa gói sao lưu *
              </label>
              <input
                type="password"
                value={backupPassword}
                onChange={(e) => setBackupPassword(e.target.value)}
                placeholder="Nhập mật khẩu bảo vệ tệp sao lưu"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005A2E] focus:outline-none font-mono text-xs bg-white"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleExportBackup}
              className="px-4 py-2 bg-[#005A2E] hover:bg-[#004724] text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>TẢI GÓI SAO LƯU AN TOÀN (.AGRIPASS)</span>
            </button>
          </div>

          {/* Import Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Upload className="w-4 h-4 text-[#8C1D2F]" />
              <span>2. KHÔI PHỤC DỮ LIỆU TỪ TỆP SAO LƯU</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Chọn tệp sao lưu (.agripass) *
              </label>
              <input
                type="file"
                accept=".agripass,.enc"
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Mật khẩu giải mã gói sao lưu *
              </label>
              <input
                type="password"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                placeholder="Nhập mật khẩu đã dùng khi sao lưu"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005A2E] focus:outline-none font-mono text-xs bg-white"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing || !selectedFile}
              onClick={handleImportBackup}
              className="px-4 py-2 bg-[#8C1D2F] hover:bg-[#721524] text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-amber-300" />
              <span>BẮT ĐẦU KHÔI PHỤC KHO MẬT KHẨU</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
