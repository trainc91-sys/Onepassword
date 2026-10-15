import React, { useState, useEffect } from 'react';
import { VaultAccount, AccountCategory, SystemRole } from '../types';
import { generateStrongPassword, evaluatePasswordStrength, encryptText, decryptText } from '../utils/crypto';
import { getMasterKey } from '../utils/storage';
import { X, RefreshCw, Eye, EyeOff, ShieldCheck, Key, Link as LinkIcon, AppWindow } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: VaultAccount) => void;
  accountToEdit?: VaultAccount | null;
  currentUser: { fullName: string; username: string };
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accountToEdit,
  currentUser,
}) => {
  const [appName, setAppName] = useState('');
  const [category, setCategory] = useState<AccountCategory>('core_banking');
  const [appPath, setAppPath] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allowedRoles, setAllowedRoles] = useState<SystemRole[]>(['admin', 'supervisor', 'officer']);

  useEffect(() => {
    if (accountToEdit) {
      setAppName(accountToEdit.appName);
      setCategory(accountToEdit.category);
      setAppPath(accountToEdit.appPath);
      setUsername(accountToEdit.username);
      setNotes(accountToEdit.notes || '');
      setAllowedRoles(accountToEdit.allowedRoles || ['admin', 'supervisor', 'officer']);

      // Decrypt password for editing
      const masterKey = getMasterKey();
      decryptText(accountToEdit.encryptedPassword, masterKey)
        .then((decrypted) => setPassword(decrypted))
        .catch(() => setPassword(''));
    } else {
      setAppName('');
      setCategory('core_banking');
      setAppPath('');
      setUsername('');
      setPassword(generateStrongPassword({
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
      }));
      setNotes('');
      setAllowedRoles(['admin', 'supervisor', 'officer']);
    }
  }, [accountToEdit, isOpen]);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const newPass = generateStrongPassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });
    setPassword(newPass);
    setShowPassword(true);
  };

  const strength = evaluatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const masterKey = getMasterKey();
      const encryptedPassword = await encryptText(password, masterKey);

      const account: VaultAccount = {
        id: accountToEdit ? accountToEdit.id : `acc-${Date.now()}`,
        appName: appName.trim(),
        category,
        appPath: appPath.trim(),
        username: username.trim(),
        encryptedPassword,
        notes: notes.trim(),
        allowedRoles,
        lastModified: new Date().toISOString(),
        lastModifiedBy: currentUser.username,
        passwordStrength: strength.label,
      };

      onSave(account);
      onClose();
    } catch (err: unknown) {
      alert(`Không thể lưu tài khoản: ${err instanceof Error ? err.message : 'Lỗi mã hóa'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRole = (role: SystemRole) => {
    if (allowedRoles.includes(role)) {
      if (allowedRoles.length === 1) return; // Must keep at least one
      setAllowedRoles(allowedRoles.filter((r) => r !== role));
    } else {
      setAllowedRoles([...allowedRoles, role]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#005A2E] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#8C1D2F]">
          <div className="flex items-center gap-2">
            <AppWindow className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-sm tracking-wide">
              {accountToEdit ? 'CHỈNH SỬA TÀI KHOẢN ỨNG DỤNG' : 'THÊM MỚI TÀI KHOẢN ỨNG DỤNG NỘI BỘ'}
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tên ứng dụng / Chương trình *
              </label>
              <input
                type="text"
                required
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="VD: IPCAS II, CITAD, ARMS..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005A2E] focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phân nhóm nghiệp vụ *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AccountCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005A2E] focus:outline-none font-medium bg-white"
              >
                <option value="core_banking">Core Banking (IPCAS / Tiền gửi / Tiền vay)</option>
                <option value="payment_citad">Thanh toán Liên ngân hàng (CITAD / NHNN)</option>
                <option value="credit_risk">Tín dụng & Thẩm định rủi ro (CRIS, ARMS)</option>
                <option value="accounting_treasury">Kế toán & Ngân quỹ (TCS Kho bạc, MIS)</option>
                <option value="internal_portal">Cổng nội bộ & Điều hành (E-Office, Webmail)</option>
                <option value="database_system">Hệ quản trị Cơ sở dữ liệu & Máy chủ</option>
                <option value="external_services">Dịch vụ Đối tác & Cơ quan Nhà nước</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Đường dẫn chương trình (URL nội bộ / IP / Đường dẫn file .exe) *</span>
            </label>
            <input
              type="text"
              required
              value={appPath}
              onChange={(e) => setAppPath(e.target.value)}
              placeholder="VD: http://10.12.18.25:8080/ipcas/login hoặc C:\Agribank\ipcas.exe"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005A2E] focus:outline-none font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tên đăng nhập (Username) *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="VD: trai.nc_ca_mau"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005A2E] focus:outline-none font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Mật khẩu bảo vệ (Password) *
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-xs text-[#005A2E] hover:text-[#004724] font-semibold flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" /> Tạo ngẫu nhiên
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập hoặc tạo mật khẩu"
                  className="w-full pl-3 pr-16 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005A2E] focus:outline-none font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Meter */}
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strength.score >= 80
                        ? 'bg-emerald-600'
                        : strength.score >= 60
                        ? 'bg-blue-600'
                        : strength.score >= 40
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-600 capitalize">
                  {strength.label}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Ghi chú tác nghiệp / Hướng dẫn đăng nhập
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Cần cắm USB Token Agribank trước khi bấm xác thực; Đổi mật khẩu định kỳ 60 ngày..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005A2E] focus:outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Phân quyền vai trò được phép truy cập tài nguyên này
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors text-xs ${
                  allowedRoles.includes('admin')
                    ? 'bg-emerald-50 border-[#005A2E] text-[#005A2E] font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={allowedRoles.includes('admin')}
                  onChange={() => toggleRole('admin')}
                  className="rounded text-[#005A2E] focus:ring-[#005A2E]"
                />
                <span>Quản trị viên (Admin)</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors text-xs ${
                  allowedRoles.includes('supervisor')
                    ? 'bg-emerald-50 border-[#005A2E] text-[#005A2E] font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={allowedRoles.includes('supervisor')}
                  onChange={() => toggleRole('supervisor')}
                  className="rounded text-[#005A2E] focus:ring-[#005A2E]"
                />
                <span>Trưởng phòng / KSV</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors text-xs ${
                  allowedRoles.includes('officer')
                    ? 'bg-emerald-50 border-[#005A2E] text-[#005A2E] font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={allowedRoles.includes('officer')}
                  onChange={() => toggleRole('officer')}
                  className="rounded text-[#005A2E] focus:ring-[#005A2E]"
                />
                <span>Cán bộ nghiệp vụ</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#005A2E] hover:bg-[#004724] text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>{accountToEdit ? 'LƯU CẬP NHẬT (MÃ HÓA AES-256)' : 'LƯU TÀI KHOẢN MỚI'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
