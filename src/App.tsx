/**
 * Agribank One Password - Enterprise Password Management Solution
 * Compliance: ISO/IEC 27001:2022 · 100% Offline Intranet Architecture
 * Developed for Agribank Chi Nhánh Cà Mau
 * Copyright © 2026 Nguyễn Công Trái
 */

import React, { useState, useEffect, useRef } from 'react';
import { SystemUser, VaultAccount, Permission } from './types';
import {
  initializeDatabase,
  getCurrentSession,
  setCurrentSession,
  getAccounts,
  saveAccounts,
  addAuditLog,
  hasPermission,
  getMasterKey,
} from './utils/storage';
import { decryptText } from './utils/crypto';
import { copyToClipboard } from './utils/clipboard';
import { AgribankLogo } from './components/AgribankLogo';
import { OnePasswordShield } from './components/OnePasswordShield';
import { LoginScreen } from './components/LoginScreen';
import { AccountModal } from './components/AccountModal';
import { OfficeCryptoModal } from './components/OfficeCryptoModal';
import { BrowserCleanupModal } from './components/BrowserCleanupModal';
import { UserManagementModal } from './components/UserManagementModal';
import { AuditLogViewer } from './components/AuditLogViewer';
import { QuickAccessModal } from './components/QuickAccessModal';
import { BackupModal } from './components/BackupModal';
import {
  Search,
  PlusCircle,
  Zap,
  Trash2,
  Copy,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  LogOut,
  ShieldCheck,
  FileSpreadsheet,
  Globe,
  Users,
  FileText,
  HardDrive,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Lock,
  WifiOff,
  ShieldAlert,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [accounts, setAccounts] = useState<VaultAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<VaultAccount | null>(null);
  const [isOfficeModalOpen, setIsOfficeModalOpen] = useState(false);
  const [isBrowserModalOpen, setIsBrowserModalOpen] = useState(false);
  const [isUserMgmtModalOpen, setIsUserMgmtModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Security Feedback & Clipboard Watcher
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const [clipboardTimer, setClipboardTimer] = useState<number | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<{ id: string; text: string } | null>(null);

  // Initialize DB on boot
  useEffect(() => {
    initializeDatabase().then(() => {
      const loadedAccounts = getAccounts();
      setAccounts(loadedAccounts);
      if (loadedAccounts.length > 0) {
        setSelectedAccountId(loadedAccounts[0].id);
      }
      const session = getCurrentSession();
      if (session) {
        setCurrentUser(session);
      }
      setIsDbReady(true);
    });
  }, []);

  // Global Keyboard Shortcut: Ctrl + Shift + Space for Quick Access
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        if (currentUser) {
          setIsQuickAccessOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser]);

  // Auto-clear clipboard countdown
  useEffect(() => {
    if (clipboardTimer === null) return;
    if (clipboardTimer <= 0) {
      navigator.clipboard.writeText('').catch(() => {});
      setClipboardTimer(null);
      setNotification({
        text: 'Bộ đệm Clipboard đã được tự động xóa an toàn (ISO 27001).',
        type: 'info',
      });
      return;
    }
    const timer = setTimeout(() => {
      setClipboardTimer((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [clipboardTimer]);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, 4000);
  };

  const handleLoginSuccess = (user: SystemUser) => {
    setCurrentUser(user);
    setAccounts(getAccounts());
    // Auto-select first account if available
    const accs = getAccounts();
    if (accs.length > 0) {
      setSelectedAccountId(accs[0].id);
    }
    showToast(`Chào mừng cán bộ ${user.fullName} (${user.department}) đăng nhập thành công.`, 'success');
  };

  const handleLogout = () => {
    if (currentUser) {
      addAuditLog({
        userId: currentUser.username,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        department: currentUser.department,
        action: 'LOGOUT',
        resource: 'Agribank One Password Session',
        details: 'Cán bộ đăng xuất an toàn. Giải phóng bộ nhớ đệm máy trạm.',
        clientIp: '10.12.18.88',
        severity: 'low',
        isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
      });
    }
    setCurrentSession(null);
    setCurrentUser(null);
    setSelectedAccountId(null);
    setRevealedPassword(null);
    setClipboardTimer(null);
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Operations: Copy User
  const handleCopyUser = async (account?: VaultAccount) => {
    const target = account || selectedAccount;
    if (!target) {
      showToast('Vui lòng chọn một dòng ứng dụng trong bảng', 'warning');
      return;
    }

    await copyToClipboard(target.username);
    showToast(`Đã sao chép User: "${target.username}" vào bộ nhớ tạm.`, 'success');

    if (currentUser) {
      addAuditLog({
        userId: currentUser.username,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        department: currentUser.department,
        action: 'COPY_USER',
        resource: target.appName,
        details: `Sao chép tên người dùng '${target.username}' cho ứng dụng ${target.appName}`,
        clientIp: '10.12.18.88',
        severity: 'low',
        isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
      });
    }
  };

  // Operations: Copy Password (with 30s auto-wipe)
  const handleCopyPassword = async (account?: VaultAccount) => {
    const target = account || selectedAccount;
    if (!target) {
      showToast('Vui lòng chọn một dòng ứng dụng trong bảng', 'warning');
      return;
    }

    if (!hasPermission(currentUser, 'copy_credentials')) {
      showToast('Cán bộ chưa được Admin cấp quyền sao chép mật khẩu!', 'warning');
      return;
    }

    try {
      const masterKey = getMasterKey();
      const plainPassword = await decryptText(target.encryptedPassword, masterKey);

      await copyToClipboard(plainPassword);
      setClipboardTimer(30);
      showToast(`Đã sao chép mật khẩu "${target.appName}"! Tự hủy clipboard sau 30 giây.`, 'success');

      if (currentUser) {
        addAuditLog({
          userId: currentUser.username,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          department: currentUser.department,
          action: 'COPY_PASSWORD',
          resource: target.appName,
          details: `Giải mã và sao chép mật khẩu ứng dụng ${target.appName} vào clipboard`,
          clientIp: '10.12.18.88',
          severity: 'medium',
          isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
        });
      }
    } catch (err: unknown) {
      showToast(`Không thể giải mã: ${err instanceof Error ? err.message : 'Lỗi'}`, 'warning');
    }
  };

  // Operations: Show / Reveal Password
  const handleToggleShowPassword = async () => {
    if (!selectedAccount) {
      showToast('Vui lòng chọn một dòng ứng dụng trong bảng', 'warning');
      return;
    }

    if (!hasPermission(currentUser, 'view_password')) {
      showToast('Cán bộ chưa được Admin cấp quyền xem trực tiếp mật khẩu!', 'warning');
      return;
    }

    if (revealedPassword && revealedPassword.id === selectedAccount.id) {
      setRevealedPassword(null);
      return;
    }

    try {
      const masterKey = getMasterKey();
      const plain = await decryptText(selectedAccount.encryptedPassword, masterKey);
      setRevealedPassword({ id: selectedAccount.id, text: plain });

      if (currentUser) {
        addAuditLog({
          userId: currentUser.username,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          department: currentUser.department,
          action: 'VIEW_PASSWORD',
          resource: selectedAccount.appName,
          details: `Xem trực tiếp mật khẩu ứng dụng '${selectedAccount.appName}' trên giao diện`,
          clientIp: '10.12.18.88',
          severity: 'medium',
          isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
        });
      }
    } catch {
      showToast('Không thể hiển thị mật khẩu', 'warning');
    }
  };

  // Operations: Open Application
  const handleOpenApplication = (account?: VaultAccount) => {
    const target = account || selectedAccount;
    if (!target) {
      showToast('Vui lòng chọn một dòng ứng dụng trong bảng', 'warning');
      return;
    }

    const path = target.appPath.trim();
    if (path.startsWith('http://') || path.startsWith('https://')) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      // Local program path e.g. C:\...
      copyToClipboard(path);
      showToast(`Đã sao chép đường dẫn phần mềm: "${path}" vào bộ đệm`, 'info');
    }

    if (currentUser) {
      addAuditLog({
        userId: currentUser.username,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        department: currentUser.department,
        action: 'OPEN_APPLICATION',
        resource: target.appName,
        details: `Mở hoặc khởi chạy đường dẫn ứng dụng: ${target.appPath}`,
        clientIp: '10.12.18.88',
        severity: 'low',
        isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
      });
    }
  };

  // Operations: Delete Account
  const handleDeleteAccount = () => {
    if (!selectedAccount) {
      showToast('Vui lòng chọn tài khoản cần xóa', 'warning');
      return;
    }

    if (!hasPermission(currentUser, 'manage_accounts')) {
      showToast('Cán bộ không có quyền xóa tài khoản trên hệ thống!', 'warning');
      return;
    }

    if (window.confirm(`Xác nhận xóa vĩnh viễn cấu hình ứng dụng "${selectedAccount.appName}"?`)) {
      const updated = accounts.filter((a) => a.id !== selectedAccount.id);
      saveAccounts(updated);
      setAccounts(updated);
      setSelectedAccountId(updated.length > 0 ? updated[0].id : null);
      showToast(`Đã xóa ứng dụng "${selectedAccount.appName}"`, 'success');

      if (currentUser) {
        addAuditLog({
          userId: currentUser.username,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          department: currentUser.department,
          action: 'DELETE_ACCOUNT',
          resource: selectedAccount.appName,
          details: `Xóa tài khoản ứng dụng ${selectedAccount.appName} (User: ${selectedAccount.username})`,
          clientIp: '10.12.18.88',
          severity: 'high',
          isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
        });
      }
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((a) => {
    const matchesQuery =
      a.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.appPath.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.notes && a.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;

    return matchesQuery && matchesCategory;
  });

  if (!isDbReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide">Đang khởi tạo Agribank One Password...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show high-security Login Screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 select-none">
      {/* OS Window Style Title Bar */}
      <div className="bg-[#004724] text-white px-3 py-1 flex items-center justify-between text-xs border-b border-[#00381C]">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider">FORM MAIN</span>
          <span className="text-emerald-300">|</span>
          <span className="text-emerald-100 font-medium">Agribank One Password 2026</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-200 text-[11px]">
          <span className="flex items-center gap-1">
            <WifiOff className="w-3 h-3 text-amber-300" /> Offline Intranet
          </span>
          <span>·</span>
          <span>ISO/IEC 27001:2022</span>
        </div>
      </div>

      {/* Classic Menu Bar (Matching Desktop Banking Software: "Hệ thống", "Trợ giúp"...) */}
      <div className="bg-white px-4 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs shadow-xs">
        <div className="flex items-center gap-4 text-slate-700">
          <div className="relative group">
            <button type="button" className="font-semibold hover:text-[#005A2E] cursor-pointer py-1">
              Hệ thống ▾
            </button>
            <div className="absolute left-0 top-full hidden group-hover:block bg-white shadow-xl border border-slate-200 rounded-lg py-1 w-56 z-40 text-xs">
              {hasPermission(currentUser, 'manage_users') && (
                <button
                  type="button"
                  onClick={() => setIsUserMgmtModalOpen(true)}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 hover:text-[#005A2E] flex items-center gap-2 font-medium"
                >
                  <Users className="w-4 h-4 text-[#005A2E]" />
                  <span>Quản lý Cán bộ & Phân quyền</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(true)}
                className="w-full text-left px-3 py-2 hover:bg-emerald-50 hover:text-[#005A2E] flex items-center gap-2 font-medium"
              >
                <HardDrive className="w-4 h-4 text-amber-600" />
                <span>Sao lưu & Khôi phục Vault</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBrowserModalOpen(true)}
                className="w-full text-left px-3 py-2 hover:bg-emerald-50 hover:text-[#005A2E] flex items-center gap-2 font-medium"
              >
                <Globe className="w-4 h-4 text-red-600" />
                <span>Dọn mật khẩu Chrome/Firefox</span>
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất phiên làm việc</span>
              </button>
            </div>
          </div>

          {/* Quick Access Menu Item */}
          <button
            type="button"
            onClick={() => setIsQuickAccessOpen(true)}
            className="hover:text-[#005A2E] font-medium flex items-center gap-1 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Access (Ctrl-Shift-Space)</span>
          </button>

          {/* Office Crypto Menu Item */}
          {hasPermission(currentUser, 'office_crypto') && (
            <button
              type="button"
              onClick={() => setIsOfficeModalOpen(true)}
              className="hover:text-[#005A2E] font-medium flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Khóa/Mở Office hàng loạt</span>
            </button>
          )}

          {/* Audit Logs Menu Item */}
          {hasPermission(currentUser, 'view_audit_logs') && (
            <button
              type="button"
              onClick={() => setIsAuditModalOpen(true)}
              className="hover:text-[#005A2E] font-medium flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Nhật ký Kiểm toán ISO 27001</span>
            </button>
          )}

          {/* Help Menu */}
          <div className="relative group">
            <button type="button" className="font-semibold hover:text-[#005A2E] cursor-pointer py-1">
              Trợ giúp ▾
            </button>
            <div className="absolute left-0 top-full hidden group-hover:block bg-white shadow-xl border border-slate-200 rounded-lg py-1 w-64 z-40 text-xs">
              <div className="px-3 py-2 text-slate-500 text-[11px] border-b border-slate-100">
                Agribank One Password v2026.1
              </div>
              <div className="px-3 py-2 text-slate-600 text-[11px]">
                Quy định an toàn thông tin: Cán bộ không được tiết lộ mật khẩu, không ghi chép giấy và định kỳ 60 ngày đổi mật khẩu hệ thống.
              </div>
            </div>
          </div>
        </div>

        {/* Workstation Info Badge */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="hidden sm:inline">Máy trạm: <strong className="text-slate-700">10.12.18.88</strong></span>
          <span className="hidden sm:inline">·</span>
          <span>Phòng: <strong className="text-slate-700">{currentUser.department}</strong></span>
        </div>
      </div>

      {/* Main Form Header matching user screenshot: Logo, User Login, Search, Tips, Shield */}
      <div className="bg-white px-4 sm:px-6 py-4 border-b border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left: Agribank Logo + User Login display */}
          <div className="flex items-center gap-4 shrink-0">
            <AgribankLogo size="md" subtitle="CHI NHÁNH CÀ MAU" />

            <div className="h-10 w-[1px] bg-slate-200 hidden sm:block" />

            <div>
              <div className="text-xs font-bold text-slate-900 tracking-wide">
                User Login:{' '}
                <span className="text-[#005A2E] font-mono text-sm underline decoration-emerald-300">
                  {currentUser.username}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="font-medium text-slate-700">{currentUser.fullName}</span>
                <span>·</span>
                <span className="text-[10px] bg-emerald-50 text-[#005A2E] px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                  {currentUser.role === 'admin' ? 'Quản trị viên' : 'Cán bộ'}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Search Box & Tip Hints (Matching uploaded screenshot with red callout box!) */}
          <div className="flex-1 max-w-xl w-full flex flex-col items-center">
            {/* Search Input Bar */}
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4 text-[#005A2E]" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Q Search (Tìm theo tên ứng dụng, URL, User...)"
                className="w-full pl-9 pr-4 py-2 border-2 border-slate-300 rounded-lg text-sm focus:border-[#005A2E] focus:outline-none font-medium bg-slate-50/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* The iconic Tip Box with Red Callout from user's screenshot */}
            <div className="mt-2 text-center text-xs text-[#8C1D2F] italic border border-red-200/80 bg-red-50/40 px-4 py-1.5 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 shadow-2xs">
              <span className="flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Double click vào một dòng để chỉnh sửa thông tin</span>
              </span>
              <span className="hidden sm:inline text-red-300">·</span>
              <span className="flex items-center gap-1 font-semibold">
                <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Nhấn tổ hợp phím Ctrl - Shift - Space để mở Quick Access</span>
              </span>
            </div>
          </div>

          {/* Right: The Red "AGRIBANK ONE PASSWORD" Shield Emblem Badge */}
          <div className="shrink-0 flex items-center">
            <OnePasswordShield size="md" />
          </div>
        </div>
      </div>

      {/* Clipboard Countdown Warning Bar */}
      {clipboardTimer !== null && (
        <div className="bg-amber-500 text-slate-900 px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-xs animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-950" />
            <span>
              MẬT KHẨU ĐANG TRONG BỘ NHỚ CLIPBOARD: Sẽ tự động xóa trắng sau{' '}
              <strong className="text-white font-mono text-sm underline">{clipboardTimer} giây</strong> để đảm bảo an toàn ISO/IEC 27001!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setClipboardTimer(0)}
            className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded font-bold hover:bg-black cursor-pointer"
          >
            Xóa ngay
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-20 right-6 z-50 px-4 py-2.5 rounded-lg shadow-xl text-xs font-bold flex items-center gap-2 border transition-all ${
            notification.type === 'success'
              ? 'bg-[#005A2E] text-white border-emerald-400'
              : notification.type === 'warning'
              ? 'bg-amber-600 text-white border-amber-300'
              : 'bg-slate-800 text-white border-slate-600'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Content Area: Table of Stored Applications */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden flex flex-col h-full">
          {/* Table Header Filter Bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 uppercase">Danh mục:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'core_banking', label: 'Core Banking (IPCAS)' },
                  { id: 'payment_citad', label: 'CITAD Liên NH' },
                  { id: 'credit_risk', label: 'Tín dụng & CRIS' },
                  { id: 'internal_portal', label: 'E-Office & Mail' },
                  { id: 'accounting_treasury', label: 'Kho bạc TCS' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      categoryFilter === cat.id
                        ? 'bg-[#005A2E] text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-slate-500 font-semibold text-[11px]">
              Hiển thị: <strong className="text-slate-800">{filteredAccounts.length}</strong> / {accounts.length} ứng dụng
            </div>
          </div>

          {/* Table Element */}
          <div className="flex-1 overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-xs uppercase tracking-wide">
                  <th className="p-3 w-8 text-center">#</th>
                  <th className="p-3">Ứng dụng (Application)</th>
                  <th className="p-3">Đường dẫn (URL / IP Máy chủ / File)</th>
                  <th className="p-3">User (Tên đăng nhập)</th>
                  <th className="p-3">Mật khẩu (Protected)</th>
                  <th className="p-3">Phân quyền vai trò</th>
                  <th className="p-3">Cập nhật lần cuối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      Không tìm thấy ứng dụng hoặc tài khoản nào phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account, index) => {
                    const isSelected = selectedAccountId === account.id;
                    const isRevealed = revealedPassword?.id === account.id;

                    return (
                      <tr
                        key={account.id}
                        onClick={() => setSelectedAccountId(account.id)}
                        onDoubleClick={() => {
                          if (hasPermission(currentUser, 'manage_accounts')) {
                            setAccountToEdit(account);
                            setIsAccountModalOpen(true);
                          } else {
                            showToast('Cán bộ không có quyền sửa thông tin tài khoản này!', 'warning');
                          }
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50/80 hover:bg-blue-50 border-l-4 border-l-[#005A2E] font-medium'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                          {index + 1}
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{account.appName}</span>
                          </div>
                          {account.notes && (
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">
                              {account.notes}
                            </div>
                          )}
                        </td>

                        <td className="p-3 font-mono text-[11px] text-slate-600 max-w-[220px] truncate" title={account.appPath}>
                          <span className="hover:underline text-blue-700" onClick={(e) => {
                            e.stopPropagation();
                            handleOpenApplication(account);
                          }}>
                            {account.appPath}
                          </span>
                        </td>

                        <td className="p-3 font-semibold text-slate-800 font-mono text-[11px]">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {account.username}
                          </span>
                        </td>

                        <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {isRevealed ? (
                            <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold border border-emerald-300">
                              {revealedPassword.text}
                            </span>
                          ) : (
                            <span className="tracking-widest text-slate-400 font-black">
                              ••••••••••••
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-slate-600">
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 uppercase font-semibold">
                            {account.allowedRoles?.join(', ') || 'Tất cả vai trò'}
                          </span>
                        </td>

                        <td className="p-3 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                          {new Date(account.lastModified).toLocaleDateString('vi-VN')}
                          <div className="text-[10px] text-slate-400">bởi @{account.lastModifiedBy}</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Sub-toolbar: ADD, AUTO FILL, DELETE (Matching user's screenshot layout!) */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* ADD Button */}
              {hasPermission(currentUser, 'manage_accounts') && (
                <button
                  type="button"
                  onClick={() => {
                    setAccountToEdit(null);
                    setIsAccountModalOpen(true);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs rounded-lg shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  <span>ADD</span>
                </button>
              )}

              {/* AUTO FILL Button */}
              <button
                type="button"
                onClick={() => setIsQuickAccessOpen(true)}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs rounded-lg shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>AUTO FILL</span>
              </button>

              {/* DELETE Button */}
              {hasPermission(currentUser, 'manage_accounts') && (
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={!selectedAccount}
                  className="px-4 py-2 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-300 text-red-700 font-bold text-xs rounded-lg shadow-2xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>DELETE</span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-500">
              Đang chọn:{' '}
              <strong className="text-slate-800 font-medium">
                {selectedAccount ? selectedAccount.appName : 'Chưa chọn'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Bottom Action Bar matching user's screenshot! */}
      {/* "khi đăng nhập vào chương trình thành công thì các nút thao tác như Copy User, Copy password,... mới hiển thị cho phép người dùng thao tác thêm,xóa, sửa nội dung đã lưu trữ" */}
      <div className="bg-white border-t border-slate-300 px-4 sm:px-6 py-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 flex-1">
            {/* 1. COPY USER BUTTON */}
            <button
              type="button"
              disabled={!selectedAccount}
              onClick={() => handleCopyUser()}
              className="py-2.5 px-3 bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-300 hover:border-slate-400 text-slate-800 text-xs sm:text-sm font-bold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Copy className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="whitespace-nowrap">COPY USER</span>
            </button>

            {/* 2. COPY PASSWORD BUTTON */}
            <button
              type="button"
              disabled={!selectedAccount || !hasPermission(currentUser, 'copy_credentials')}
              onClick={() => handleCopyPassword()}
              className="py-2.5 px-3 bg-white hover:bg-emerald-50 active:bg-emerald-100 border-2 border-slate-300 hover:border-[#005A2E] text-slate-800 text-xs sm:text-sm font-bold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Key className="w-4 h-4 text-[#005A2E] shrink-0" />
              <span className="whitespace-nowrap">COPY PASSWORD</span>
            </button>

            {/* 3. SHOW PASSWORD BUTTON */}
            <button
              type="button"
              disabled={!selectedAccount || !hasPermission(currentUser, 'view_password')}
              onClick={handleToggleShowPassword}
              className="py-2.5 px-3 bg-white hover:bg-amber-50 active:bg-amber-100 border-2 border-slate-300 hover:border-amber-500 text-slate-800 text-xs sm:text-sm font-bold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {revealedPassword?.id === selectedAccount?.id ? (
                <>
                  <EyeOff className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="whitespace-nowrap">HIDE PASSWORD</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="whitespace-nowrap">SHOW PASSWORD</span>
                </>
              )}
            </button>

            {/* 4. OPEN APPLICATION BUTTON */}
            <button
              type="button"
              disabled={!selectedAccount}
              onClick={() => handleOpenApplication()}
              className="py-2.5 px-3 bg-white hover:bg-blue-50 active:bg-blue-100 border-2 border-slate-300 hover:border-blue-500 text-slate-800 text-xs sm:text-sm font-bold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="whitespace-nowrap">OPEN APPLICATION</span>
            </button>

            {/* 5. LOG OUT BUTTON */}
            <button
              type="button"
              onClick={handleLogout}
              className="col-span-2 sm:col-span-1 py-2.5 px-3 bg-white hover:bg-red-50 active:bg-red-100 border-2 border-slate-300 hover:border-red-400 text-red-700 text-xs sm:text-sm font-bold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-600 shrink-0" />
              <span className="whitespace-nowrap">LOG OUT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer matching user screenshot: "© 2026 - Developed by Nguyễn Công Trái" */}
      <div className="bg-slate-100 border-t border-slate-200 px-4 py-2 text-center text-xs text-slate-500 italic">
        © 2026 - Developed by Nguyễn Công Trái · Hệ thống Quản lý Mật khẩu Agribank One Password (ISO/IEC 27001)
      </div>

      {/* Modals */}
      {isAccountModalOpen && (
        <AccountModal
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
          accountToEdit={accountToEdit}
          currentUser={currentUser}
          onSave={(acc) => {
            const current = getAccounts();
            let updated: VaultAccount[];
            if (accountToEdit) {
              updated = current.map((a) => (a.id === acc.id ? acc : a));
              addAuditLog({
                userId: currentUser.username,
                userName: currentUser.fullName,
                userRole: currentUser.role,
                department: currentUser.department,
                action: 'UPDATE_ACCOUNT',
                resource: acc.appName,
                details: `Cập nhật thông tin tài khoản ứng dụng ${acc.appName} (User: ${acc.username})`,
                clientIp: '10.12.18.88',
                severity: 'medium',
                isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
              });
            } else {
              updated = [acc, ...current];
              addAuditLog({
                userId: currentUser.username,
                userName: currentUser.fullName,
                userRole: currentUser.role,
                department: currentUser.department,
                action: 'ADD_ACCOUNT',
                resource: acc.appName,
                details: `Thêm mới ứng dụng ${acc.appName} vào kho bảo mật (User: ${acc.username})`,
                clientIp: '10.12.18.88',
                severity: 'medium',
                isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
              });
            }
            saveAccounts(updated);
            setAccounts(updated);
            setSelectedAccountId(acc.id);
            showToast(`Đã lưu ứng dụng "${acc.appName}" thành công!`, 'success');
          }}
        />
      )}

      {isOfficeModalOpen && (
        <OfficeCryptoModal
          isOpen={isOfficeModalOpen}
          onClose={() => setIsOfficeModalOpen(false)}
          currentUser={currentUser}
        />
      )}

      {isBrowserModalOpen && (
        <BrowserCleanupModal
          isOpen={isBrowserModalOpen}
          onClose={() => setIsBrowserModalOpen(false)}
          currentUser={currentUser}
        />
      )}

      {isUserMgmtModalOpen && (
        <UserManagementModal
          isOpen={isUserMgmtModalOpen}
          onClose={() => setIsUserMgmtModalOpen(false)}
          currentUser={currentUser}
        />
      )}

      {isAuditModalOpen && (
        <AuditLogViewer
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          currentUser={currentUser}
        />
      )}

      {isQuickAccessOpen && (
        <QuickAccessModal
          isOpen={isQuickAccessOpen}
          onClose={() => setIsQuickAccessOpen(false)}
          accounts={accounts}
          onCopyUser={(acc) => handleCopyUser(acc)}
          onCopyPassword={(acc) => handleCopyPassword(acc)}
          onOpenApp={(acc) => handleOpenApplication(acc)}
        />
      )}

      {isBackupModalOpen && (
        <BackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          currentUser={currentUser}
          onRefreshAccounts={() => {
            const accs = getAccounts();
            setAccounts(accs);
            if (accs.length > 0) setSelectedAccountId(accs[0].id);
          }}
        />
      )}
    </div>
  );
}
