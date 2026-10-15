import React, { useState } from 'react';
import {
  BROWSER_CLEANUP_BATCH_SCRIPT,
  BROWSER_CLEANUP_POWERSHELL_SCRIPT,
  downloadScript,
} from '../utils/browserCleaner';
import { addAuditLog } from '../utils/storage';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Download,
  Terminal,
  CheckCircle2,
  ExternalLink,
  Laptop,
  Flame,
  FileCode,
} from 'lucide-react';

interface BrowserCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { fullName: string; username: string; role: any; department: string };
}

export const BrowserCleanupModal: React.FC<BrowserCleanupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [hasRunCheck, setHasRunCheck] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadBatch = () => {
    downloadScript(BROWSER_CLEANUP_BATCH_SCRIPT, 'Agribank_ISO27001_Clean_Browser_Passwords.bat');
    setDownloadSuccess('Đã tải kịch bản Windows Batch (.bat). Cán bộ chỉ cần click đúp chuột để chạy!');

    addAuditLog({
      userId: currentUser.username,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      department: currentUser.department,
      action: 'BROWSER_CLEANUP_SCRIPT',
      resource: 'Windows Batch Cleaner (.bat)',
      details: 'Tải kịch bản dọn dẹp sạch mật khẩu lưu trên Google Chrome, Mozilla Firefox, MS Edge',
      clientIp: '10.12.18.88',
      severity: 'low',
      isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
    });
  };

  const handleDownloadPowerShell = () => {
    downloadScript(
      BROWSER_CLEANUP_POWERSHELL_SCRIPT,
      'Agribank_ISO27001_Clean_Browser_Passwords.ps1'
    );
    setDownloadSuccess('Đã tải kịch bản PowerShell (.ps1) cho Quản trị viên Phòng Điện toán.');

    addAuditLog({
      userId: currentUser.username,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      department: currentUser.department,
      action: 'BROWSER_CLEANUP_SCRIPT',
      resource: 'PowerShell Cleaner (.ps1)',
      details: 'Tải kịch bản PowerShell thanh tẩy mật khẩu máy trạm chuẩn ISO 27001',
      clientIp: '10.12.18.88',
      severity: 'low',
      isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
    });
  };

  const handleConfirmAuditCompliance = () => {
    setHasRunCheck(true);
    addAuditLog({
      userId: currentUser.username,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      department: currentUser.department,
      action: 'BROWSER_CLEANUP_SCRIPT',
      resource: 'Workstation Compliance Verification',
      details: `Cán bộ ${currentUser.fullName} xác nhận máy trạm nội bộ đã thanh tẩy toàn bộ mật khẩu trên Chrome/Firefox đạt chuẩn ISO/IEC 27001`,
      clientIp: '10.12.18.88',
      severity: 'low',
      isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#8C1D2F] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <Flame className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                XÓA MẬT KHẨU LƯU TRÊN TRÌNH DUYỆT (CHROME / FIREFOX)
              </h3>
              <p className="text-[11px] text-amber-100">
                Tuân thủ quy chuẩn An toàn thông tin ngân hàng ISO/IEC 27001:2022
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700">
          {/* Warning Banner */}
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-900">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs uppercase text-red-700 mb-0.5">
                Cảnh báo an toàn thông tin quan trọng (Kiểm toán ISO/IEC 27001 - Điều khoản A.9.4.2)
              </div>
              <p className="text-xs leading-relaxed text-red-800">
                Trình duyệt Google Chrome và Mozilla Firefox lưu mật khẩu dưới dạng tệp dữ liệu cục bộ trên máy trạm. Nếu máy trạm bị cài mã độc hoặc dùng chung, mật khẩu hệ thống kế toán <strong>IPCAS</strong>, <strong>CITAD</strong>, <strong>E-Office</strong> có thể bị trích xuất trái phép. Mọi mật khẩu bắt buộc phải quản lý tập trung và mã hóa đầu cuối trên <strong>Agribank One Password</strong>.
              </p>
            </div>
          </div>

          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Solution 1: Automated Script */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#005A2E]" />
              <h4 className="font-bold text-xs uppercase text-slate-800">
                Cách 1: Tải công cụ dọn dẹp tự động 1-Click cho máy trạm (Khuyến nghị)
              </h4>
            </div>
            <p className="text-slate-600">
              Kịch bản tự động được Phòng Điện toán đóng gói, tự động xóa sạch kho mật khẩu SQLite của Chrome, Edge và tệp logins.json của Firefox mà không làm mất lịch sử hay dấu trang làm việc.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadBatch}
                className="px-4 py-2 bg-[#005A2E] hover:bg-[#004724] text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>TẢI SCRIPT WINDOWS BATCH (.BAT)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPowerShell}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileCode className="w-4 h-4 text-amber-300" />
                <span>TẢI SCRIPT POWERSHELL (.PS1)</span>
              </button>
            </div>
          </div>

          {/* Solution 2: Manual In-Browser Steps */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-[#8C1D2F]" />
              <h4 className="font-bold text-xs uppercase text-slate-800">
                Cách 2: Thao tác trực tiếp trên trình duyệt bằng phím tắt
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Chrome Card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Google Chrome & MS Edge</span>
                  <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-mono">
                    Ctrl + Shift + Del
                  </span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>Nhấn tổ hợp phím <kbd className="bg-white px-1 border rounded">Ctrl</kbd> + <kbd className="bg-white px-1 border rounded">Shift</kbd> + <kbd className="bg-white px-1 border rounded">Delete</kbd>.</li>
                  <li>Chọn tab <strong>Nâng cao (Advanced)</strong>.</li>
                  <li>Chọn khoảng thời gian: <strong>Từ trước đến nay (All time)</strong>.</li>
                  <li>Tích chọn <strong>Mật khẩu và dữ liệu tự động điền</strong>.</li>
                  <li>Nhấn <strong>Xóa dữ liệu (Clear data)</strong>.</li>
                </ol>
              </div>

              {/* Firefox Card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Mozilla Firefox</span>
                  <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-mono">
                    about:logins
                  </span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>Nhấn tổ hợp phím <kbd className="bg-white px-1 border rounded">Ctrl</kbd> + <kbd className="bg-white px-1 border rounded">Shift</kbd> + <kbd className="bg-white px-1 border rounded">Delete</kbd>.</li>
                  <li>Tích chọn mục <strong>Đăng nhập đã lưu (Saved Logins)</strong>.</li>
                  <li>Hoặc gõ địa chỉ <code className="bg-white px-1 border rounded">about:logins</code> trên thanh URL.</li>
                  <li>Chọn menu <strong>...</strong> và nhấn <strong>Xóa tất cả thông tin đăng nhập</strong>.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Compliance Checklist Sign-off */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0" />
              <div>
                <div className="font-bold text-emerald-900 text-xs">
                  Xác nhận tuân thủ an toàn máy trạm Agribank
                </div>
                <div className="text-[11px] text-emerald-800">
                  Ghi nhật ký xác nhận cán bộ đã dọn dẹp sạch mật khẩu trình duyệt theo tiêu chuẩn ISO/IEC 27001
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmAuditCompliance}
              disabled={hasRunCheck}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shrink-0 ${
                hasRunCheck
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-[#005A2E] hover:bg-[#004724] text-white cursor-pointer shadow-xs'
              }`}
            >
              {hasRunCheck ? '✓ Đã xác nhận kiểm toán' : 'Ký xác nhận kiểm toán'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
