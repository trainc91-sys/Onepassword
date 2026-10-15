import React, { useState } from 'react';
import { OfficeFileItem } from '../types';
import {
  encryptOfficeFile,
  decryptOfficeFile,
  injectNativeOfficeLock,
  removeNativeOfficeLock,
  createBatchDownloadZip,
  isOfficeEncryptedFile,
} from '../utils/officeCrypto';
import { generateStrongPassword } from '../utils/crypto';
import { addAuditLog } from '../utils/storage';
import {
  X,
  FileSpreadsheet,
  FileText,
  Lock,
  Unlock,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  RefreshCw,
  Archive,
  ShieldAlert,
  Info,
  KeyRound,
  FileCheck,
} from 'lucide-react';

interface OfficeCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { fullName: string; username: string; role: any; department: string };
}

export const OfficeCryptoModal: React.FC<OfficeCryptoModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'lock' | 'unlock'>('lock');
  const [files, setFiles] = useState<OfficeFileItem[]>([]);
  const [password, setPassword] = useState('Agribank@2026!');
  const [protectionMode, setProtectionMode] = useState<'native_office' | 'aes_vault'>('native_office');
  const [namingFormat, setNamingFormat] = useState<'prefix' | 'original'>('prefix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [testModalItem, setTestModalItem] = useState<OfficeFileItem | null>(null);
  const [testPasswordInput, setTestPasswordInput] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files).map((file) => {
      const lower = file.name.toLowerCase();
      let type: OfficeFileItem['type'] = 'other';
      if (lower.endsWith('.docx') || lower.endsWith('.doc')) type = 'word';
      else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) type = 'excel';
      else if (lower.endsWith('.pdf')) type = 'pdf';

      return {
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type,
        rawFile: file,
        status: 'pending' as const,
      };
    });

    setFiles((prev) => [...prev, ...incoming]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAll = () => {
    setFiles([]);
    setOverallProgress(0);
    setTestResult(null);
  };

  const generateNewPassword = () => {
    setPassword(
      generateStrongPassword({
        length: 14,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
      })
    );
  };

  const processBatchLock = async () => {
    if (files.length === 0) return;
    if (!password.trim()) {
      alert('Vui lòng nhập mật khẩu bảo vệ');
      return;
    }

    setIsProcessing(true);
    setOverallProgress(0);

    const updated = [...files];
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      item.status = 'processing';
      setFiles([...updated]);

      try {
        let resultBlob: Blob;
        let resultFileName: string;

        if (protectionMode === 'native_office') {
          // Genuine Microsoft Office ECMA-376 Agile Encryption (AES-256)
          resultBlob = await injectNativeOfficeLock(item.rawFile, password);
          resultFileName = namingFormat === 'prefix' ? `PROTECTED_${item.name}` : item.name;
        } else {
          // Bank-grade AES-256 Intranet Package (.agripass)
          resultBlob = await encryptOfficeFile(item.rawFile, password);
          resultFileName = `${item.name}.agripass`;
        }

        item.status = 'done';
        item.resultBlob = resultBlob;
        item.resultFileName = resultFileName;
        item.message = 'Đã mã hóa chuẩn ECMA-376 (AES-256). Excel/Word sẽ yêu cầu mật khẩu khi mở.';
      } catch (err: unknown) {
        item.status = 'error';
        item.message = err instanceof Error ? err.message : 'Lỗi xử lý tệp';
      }

      setOverallProgress(Math.round(((i + 1) / updated.length) * 100));
      setFiles([...updated]);
    }

    setIsProcessing(false);

    // Audit Log for ISO 27001
    addAuditLog({
      userId: currentUser.username,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      department: currentUser.department,
      action: 'BATCH_OFFICE_LOCK',
      resource: `Batch Office Protection (${files.length} tệp)`,
      details: `Đã bảo mật và đặt mật khẩu hàng loạt cho ${files.length} tệp Office theo chuẩn ${protectionMode === 'native_office' ? 'MS-OFFCRYPTO / ECMA-376 Agile' : 'AES-256'}`,
      clientIp: '10.12.18.88',
      severity: 'medium',
      isoStandardTag: 'ISO/IEC 27001 - A.10.1.1',
    });
  };

  const processBatchUnlock = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setOverallProgress(0);

    const updated = [...files];
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      item.status = 'processing';
      setFiles([...updated]);

      try {
        let resultBlob: Blob;
        let resultFileName: string;

        if (item.name.endsWith('.agripass') || item.name.endsWith('.enc')) {
          const res = await decryptOfficeFile(item.rawFile, password);
          resultBlob = res.blob;
          resultFileName = res.originalName;
        } else {
          // Strip native Office locks & ECMA-376 encrypted documents
          resultBlob = await removeNativeOfficeLock(item.rawFile, password);
          resultFileName = item.name.startsWith('PROTECTED_')
            ? item.name.replace(/^PROTECTED_/, 'UNLOCKED_')
            : `UNLOCKED_${item.name}`;
        }

        item.status = 'done';
        item.resultBlob = resultBlob;
        item.resultFileName = resultFileName;
        item.message = 'Mở khóa thành công. Đã gỡ bỏ mật khẩu bảo vệ.';
      } catch (err: unknown) {
        item.status = 'error';
        item.message = err instanceof Error ? err.message : 'Không thể giải mã (sai mật khẩu)';
      }

      setOverallProgress(Math.round(((i + 1) / updated.length) * 100));
      setFiles([...updated]);
    }

    setIsProcessing(false);

    addAuditLog({
      userId: currentUser.username,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      department: currentUser.department,
      action: 'BATCH_OFFICE_UNLOCK',
      resource: `Batch Office Unlock (${files.length} tệp)`,
      details: `Mở khóa và gỡ mật khẩu bảo vệ hàng loạt cho ${files.length} tài liệu Office`,
      clientIp: '10.12.18.88',
      severity: 'medium',
      isoStandardTag: 'ISO/IEC 27001 - A.10.1.1',
    });
  };

  const downloadSingle = (item: OfficeFileItem) => {
    if (!item.resultBlob || !item.resultFileName) return;
    const url = URL.createObjectURL(item.resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.resultFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllAsZip = async () => {
    const readyItems = files
      .filter((f) => f.status === 'done' && f.resultBlob && f.resultFileName)
      .map((f) => ({ name: f.resultFileName!, blob: f.resultBlob! }));

    if (readyItems.length === 0) return;

    const zipBlob = await createBatchDownloadZip(readyItems);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Agribank_Protected_Office_Batch_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTestOpen = async (item: OfficeFileItem) => {
    setTestModalItem(item);
    setTestPasswordInput('');
    setTestResult(null);
  };

  const executeTestVerification = async () => {
    if (!testModalItem || !testModalItem.resultBlob) return;
    try {
      const fileToTest = new File([testModalItem.resultBlob], testModalItem.resultFileName || testModalItem.name);
      await removeNativeOfficeLock(fileToTest, testPasswordInput);
      setTestResult({
        success: true,
        message: 'Mật khẩu CHÍNH XÁC! Tệp đã được bảo vệ thành công và mở khóa chuẩn xác bằng mật khẩu này.',
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Mật khẩu KHÔNG ĐÚNG! Tệp được bảo vệ an toàn và không thể mở nếu sai mật khẩu.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#005A2E] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#8C1D2F]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide uppercase">
                Bảo vệ & Mở mật khẩu file Office hàng loạt (Word / Excel)
              </h3>
              <p className="text-[11px] text-emerald-200">
                Chuẩn mã hóa Microsoft Office ECMA-376 Agile (AES-256) · 100% trong mạng nội bộ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-100 px-5 pt-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('lock');
                setFiles([]);
                setTestResult(null);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'lock'
                  ? 'bg-white text-[#005A2E] border-t-2 border-[#005A2E] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>1. ĐẶT MẬT KHẨU HÀNG LOẠT (BATCH PROTECT)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('unlock');
                setFiles([]);
                setTestResult(null);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'unlock'
                  ? 'bg-white text-[#005A2E] border-t-2 border-[#005A2E] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Unlock className="w-4 h-4 text-amber-600" />
              <span>2. MỞ KHÓA & GIẢI MÃ HÀNG LOẠT (BATCH UNLOCK)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 pb-1">
            Hỗ trợ: <strong className="text-slate-700">.xlsx, .docx, .xls, .doc</strong>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-sm">
          {/* Options Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    {activeTab === 'lock' ? 'Mật khẩu bảo vệ file *' : 'Mật khẩu giải mã *'}
                  </label>
                  {activeTab === 'lock' && (
                    <button
                      type="button"
                      onClick={generateNewPassword}
                      className="text-xs text-[#005A2E] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Sinh mật khẩu an toàn
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu áp dụng chung"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#005A2E] focus:outline-none font-mono text-xs bg-white"
                />
              </div>

              {activeTab === 'lock' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                    Chuẩn mã hóa
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label
                      className={`flex items-center gap-1.5 p-2 border rounded-md cursor-pointer ${
                        protectionMode === 'native_office'
                          ? 'bg-emerald-50 border-[#005A2E] text-[#005A2E] font-semibold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="protMode"
                        checked={protectionMode === 'native_office'}
                        onChange={() => setProtectionMode('native_office')}
                        className="text-[#005A2E]"
                      />
                      <span>Chuẩn Excel/Word (Agile)</span>
                    </label>

                    <label
                      className={`flex items-center gap-1.5 p-2 border rounded-md cursor-pointer ${
                        protectionMode === 'aes_vault'
                          ? 'bg-emerald-50 border-[#005A2E] text-[#005A2E] font-semibold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="protMode"
                        checked={protectionMode === 'aes_vault'}
                        onChange={() => setProtectionMode('aes_vault')}
                        className="text-[#005A2E]"
                      />
                      <span>Gói kho lưu .agripass</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Naming Format options */}
            {activeTab === 'lock' && (
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                <span className="font-semibold text-slate-700">Tên file sau khi bảo vệ:</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="namingFormat"
                      checked={namingFormat === 'prefix'}
                      onChange={() => setNamingFormat('prefix')}
                      className="text-[#005A2E]"
                    />
                    <span>Thêm tiền tố <strong>PROTECTED_</strong> (ví dụ: PROTECTED_Dataset 2.xlsx)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="namingFormat"
                      checked={namingFormat === 'original'}
                      onChange={() => setNamingFormat('original')}
                      className="text-[#005A2E]"
                    />
                    <span>Giữ nguyên tên gốc (để ghi đè file cũ)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Critical instruction note for User */}
          <div className="bg-amber-50/90 border border-amber-300 rounded-lg p-3 text-xs text-amber-950 flex items-start gap-2.5">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-amber-900">
                Lưu ý quan trọng khi mở file sau khi bảo vệ:
              </div>
              <p className="leading-relaxed">
                Để đảm bảo an toàn, trình duyệt web <strong>không thể tự động ghi đè</strong> file trực tiếp trên ổ cứng máy tính. Sau khi hệ thống báo <em>"Bảo vệ thành công"</em>, Quý khách vui lòng nhấn nút <strong>"Tải về"</strong> (hoặc <strong>"TẢI TẤT CẢ VỀ (.ZIP)"</strong>) và mở tệp vừa tải về. Khi mở bằng Microsoft Excel hoặc Microsoft Word, phần mềm sẽ hiển thị ngay hộp thoại yêu cầu nhập mật khẩu!
              </p>
            </div>
          </div>

          {/* Upload Drop Zone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-[#005A2E] rounded-xl p-5 text-center transition-colors bg-slate-50/50">
            <input
              type="file"
              id="office-upload"
              multiple
              accept=".docx,.xlsx,.doc,.xls,.pdf,.agripass,.enc"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label htmlFor="office-upload" className="cursor-pointer flex flex-col items-center">
              <UploadCloud className="w-9 h-9 text-[#005A2E] mb-2" />
              <div className="text-sm font-bold text-slate-700">
                Nhấn để chọn hoặc kéo thả nhiều file Word & Excel vào đây
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Tài liệu thẩm định, sao kê, danh sách khách hàng cần đặt mật khẩu bảo mật
              </div>
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Danh sách file đã chọn ({files.length} tệp):</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa danh sách
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              {isProcessing && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Đang mã hóa dữ liệu theo chuẩn ECMA-376...</span>
                    <span>{overallProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#005A2E] transition-all duration-200"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-60 overflow-y-auto bg-white">
                {files.map((file) => (
                  <div key={file.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {file.type === 'word' ? (
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                      ) : file.type === 'excel' ? (
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Archive className="w-5 h-5 text-amber-600 shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="font-semibold text-slate-800 truncate">
                          {file.name}
                          {file.resultFileName && file.resultFileName !== file.name && (
                            <span className="ml-1.5 text-[11px] font-normal text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              ➔ {file.resultFileName}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {(file.size / 1024).toFixed(1)} KB ·{' '}
                          {file.status === 'pending' && <span className="text-slate-400">Chờ xử lý</span>}
                          {file.status === 'processing' && <span className="text-amber-600">Đang mã hóa...</span>}
                          {file.status === 'done' && (
                            <span className="text-emerald-700 font-semibold">{file.message}</span>
                          )}
                          {file.status === 'error' && (
                            <span className="text-red-600 font-semibold">{file.message}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {file.status === 'done' && file.resultBlob && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleTestOpen(file)}
                            title="Kiểm tra mở thử bằng mật khẩu"
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-600" /> Thử mở pass
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadSingle(file)}
                            title="Tải file đã bảo vệ về máy"
                            className="px-2.5 py-1 bg-[#005A2E] hover:bg-[#004724] text-white rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" /> Tải về
                          </button>
                        </>
                      )}
                      {file.status === 'done' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      {file.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In-app verification modal / testing card */}
          {testModalItem && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  <span>XÁC THỰC MẬT KHẨU TỆP TRỰC TIẾP: {testModalItem.resultFileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTestModalItem(null)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-emerald-800">
                Thử nhập mật khẩu để kiểm chứng phần mềm mã hóa: đúng mật khẩu sẽ giải mã thành công, sai mật khẩu sẽ bị từ chối truy cập.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testPasswordInput}
                  onChange={(e) => setTestPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu để thử mở..."
                  className="flex-1 px-3 py-1.5 border border-emerald-300 rounded text-xs bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={executeTestVerification}
                  className="px-3 py-1.5 bg-[#005A2E] hover:bg-[#004724] text-white text-xs font-bold rounded cursor-pointer"
                >
                  Kiểm tra mở
                </button>
              </div>
              {testResult && (
                <div
                  className={`p-2 rounded text-xs font-semibold flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-red-100 text-red-900 border border-red-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Tiêu chuẩn ISO/IEC 27001 Control A.10.1.1 (Mã hóa tài liệu ngân hàng)</span>
          </div>

          <div className="flex items-center gap-2">
            {files.some((f) => f.status === 'done') && (
              <button
                type="button"
                onClick={downloadAllAsZip}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Archive className="w-4 h-4" />
                <span>TẢI TẤT CẢ VỀ (.ZIP)</span>
              </button>
            )}

            {activeTab === 'lock' ? (
              <button
                type="button"
                disabled={isProcessing || files.length === 0}
                onClick={processBatchLock}
                className="px-5 py-2 bg-[#005A2E] hover:bg-[#004724] text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4 text-amber-300" />
                <span>BẮT ĐẦU ĐẶT MẬT KHẨU HÀNG LOẠT</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isProcessing || files.length === 0}
                onClick={processBatchUnlock}
                className="px-5 py-2 bg-[#8C1D2F] hover:bg-[#721524] text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Unlock className="w-4 h-4 text-amber-300" />
                <span>BẮT ĐẦU MỞ KHÓA HÀNG LOẠT</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
