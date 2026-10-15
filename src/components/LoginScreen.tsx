import React, { useState } from 'react';
import { AgribankLogo } from './AgribankLogo';
import { OnePasswordShield } from './OnePasswordShield';
import { SystemUser } from '../types';
import { getUsers, setCurrentSession, addAuditLog } from '../utils/storage';
import { hashUserPassword } from '../utils/crypto';
import { Lock, User, ShieldCheck, WifiOff, AlertTriangle, KeyRound, Info } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: SystemUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('trainguyencong1');
  const [password, setPassword] = useState('Agribank@123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const users = getUsers();
      const user = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());

      if (!user) {
        addAuditLog({
          userId: 'UNKNOWN',
          userName: username,
          userRole: 'officer',
          department: 'Không xác định',
          action: 'LOGIN_FAILED',
          resource: 'Agribank One Password Authentication',
          details: `Đăng nhập thất bại: Tài khoản '${username}' chưa được Admin khai báo trên hệ thống`,
          clientIp: '10.12.18.88',
          severity: 'high',
          isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
        });
        setError('Tài khoản này chưa được Quản trị viên (Admin) khai báo hoặc cấp quyền sử dụng.');
        setIsLoading(false);
        return;
      }

      if (user.status === 'suspended') {
        addAuditLog({
          userId: user.id,
          userName: user.fullName,
          userRole: user.role,
          department: user.department,
          action: 'LOGIN_FAILED',
          resource: 'Agribank One Password Authentication',
          details: `Đăng nhập thất bại: Tài khoản '${username}' đang trong trạng thái Tạm khóa`,
          clientIp: '10.12.18.88',
          severity: 'high',
          isoStandardTag: 'ISO/IEC 27001 - A.9.2.1',
        });
        setError('Tài khoản cán bộ hiện đang bị khóa tạm thời. Vui lòng liên hệ Admin Phòng Điện toán.');
        setIsLoading(false);
        return;
      }

      // Verify Password Hash
      const inputHash = await hashUserPassword(password, user.salt);
      // For initial setup compatibility, check either hash or known default password
      const isMatch = (user.passwordHash && user.passwordHash === inputHash) ||
        (user.username === 'admin' && password === 'Agribank@2026') ||
        (user.username === 'trainguyencong1' && password === 'Agribank@123') ||
        (user.username === 'kiemsoatvien' && password === 'Agribank@123');

      if (!isMatch) {
        addAuditLog({
          userId: user.id,
          userName: user.fullName,
          userRole: user.role,
          department: user.department,
          action: 'LOGIN_FAILED',
          resource: 'Agribank One Password Authentication',
          details: `Xác thực sai mật khẩu cho cán bộ '${user.fullName}'`,
          clientIp: '10.12.18.88',
          severity: 'medium',
          isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
        });
        setError('Mật khẩu đăng nhập không chính xác. Vui lòng kiểm tra lại (chú ý chữ hoa/thường).');
        setIsLoading(false);
        return;
      }

      // Success
      const updatedUser: SystemUser = {
        ...user,
        lastLoginAt: new Date().toISOString(),
      };
      setCurrentSession(updatedUser);

      addAuditLog({
        userId: user.id,
        userName: user.fullName,
        userRole: user.role,
        department: user.department,
        action: 'LOGIN_SUCCESS',
        resource: 'Agribank One Password Desktop Client',
        details: `Cán bộ '${user.fullName}' (${user.department}) đăng nhập thành công. Đã nạp chính sách phân quyền.`,
        clientIp: '10.12.18.88',
        severity: 'low',
        isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
      });

      onLoginSuccess(updatedUser);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
      setError(`Lỗi xác thực hệ thống: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectDemoUser = (userLogin: string, pass: string) => {
    setUsername(userLogin);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans text-slate-800">
      {/* Top Banner Bar */}
      <div className="bg-[#005A2E] text-white px-4 py-2 flex items-center justify-between text-xs border-b-2 border-[#8C1D2F]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm" />
          <span className="font-semibold tracking-wide">MẠNG NỘI BỘ AGRIBANK INTRANET</span>
          <span className="text-emerald-200">|</span>
          <span className="flex items-center gap-1 text-emerald-100">
            <WifiOff className="w-3.5 h-3.5" /> Chế độ Offline an toàn (Không cần Internet)
          </span>
        </div>
        <div className="flex items-center gap-2 text-emerald-100">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
          <span>Tiêu chuẩn bảo mật: <strong className="text-white">ISO/IEC 27001:2022</strong></span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Card Header with Agribank Brand Palette */}
          <div className="bg-gradient-to-r from-[#005A2E] via-[#004724] to-[#00381C] p-6 text-white text-center relative">
            <div className="absolute top-3 right-3">
              <span className="bg-[#8C1D2F] text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded tracking-wider border border-amber-300/40">
                SECURED
              </span>
            </div>

            <div className="flex justify-center mb-3">
              <AgribankLogo size="lg" subtitle="CHI NHÁNH CÀ MAU" className="bg-white/95 px-4 py-2 rounded-lg shadow-md" />
            </div>

            <div className="mt-4 flex justify-center">
              <OnePasswordShield size="sm" />
            </div>

            <p className="text-xs text-emerald-100 mt-2 font-medium">
              Quản lý tài khoản & mật khẩu các ứng dụng nghiệp vụ ngân hàng
            </p>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Chính sách phân quyền:</strong> Các nút thao tác như Copy User, Copy Password, Thêm, Sửa, Xóa chỉ hiển thị sau khi đăng nhập thành công tài khoản được Admin phân quyền.
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên đăng nhập cán bộ (User Login)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005A2E] focus:border-transparent font-medium"
                    placeholder="VD: trainguyencong1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mật khẩu xác thực (Password)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005A2E] focus:border-transparent font-mono"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#005A2E] hover:bg-[#004724] text-white text-sm font-bold rounded-lg shadow transition-all duration-150 flex items-center justify-center gap-2 border border-[#004724] active:scale-[0.99] disabled:opacity-75 cursor-pointer"
              >
                {isLoading ? (
                  <span>Đang xác thực bảo mật...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-amber-300" />
                    <span>ĐĂNG NHẬP AGRIBANK ONE PASSWORD</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Switcher */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-semibold text-slate-600">Chọn tài khoản mẫu thử nghiệm:</span>
                <button
                  type="button"
                  onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                  className="text-[#005A2E] hover:underline"
                >
                  {showDemoAccounts ? 'Ẩn' : 'Hiện'}
                </button>
              </div>

              {showDemoAccounts && (
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => selectDemoUser('trainguyencong1', 'Agribank@123')}
                    className={`p-2 border rounded-md text-left transition-colors ${
                      username === 'trainguyencong1'
                        ? 'bg-emerald-50 border-[#005A2E] text-[#005A2E] font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-semibold truncate">trainguyencong1</div>
                    <div className="text-[10px] text-slate-500 truncate">Nguyễn Công Trái</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectDemoUser('admin', 'Agribank@2026')}
                    className={`p-2 border rounded-md text-left transition-colors ${
                      username === 'admin'
                        ? 'bg-emerald-50 border-[#005A2E] text-[#005A2E] font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-semibold truncate">admin</div>
                    <div className="text-[10px] text-slate-500 truncate">Quản trị toàn quyền</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectDemoUser('kiemsoatvien', 'Agribank@123')}
                    className={`p-2 border rounded-md text-left transition-colors ${
                      username === 'kiemsoatvien'
                        ? 'bg-emerald-50 border-[#005A2E] text-[#005A2E] font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-semibold truncate">kiemsoatvien</div>
                    <div className="text-[10px] text-slate-500 truncate">Kiểm toán nội bộ</div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card Footer */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center text-[11px] text-slate-500">
            Phiên bản nội bộ 2026.1 · Mã hóa đầu cuối AES-256 · ISO/IEC 27001
          </div>
        </div>
      </div>

      {/* Page Footer */}
      <div className="bg-white border-t border-slate-200 px-4 py-2 text-center text-xs text-slate-500">
        © 2026 Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank) · Developed by Nguyễn Công Trái
      </div>
    </div>
  );
};
