import React, { useState, useEffect, useRef } from 'react';
import { VaultAccount } from '../types';
import { Search, Key, User, ExternalLink, X, ArrowRight, Shield } from 'lucide-react';

interface QuickAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: VaultAccount[];
  onCopyUser: (account: VaultAccount) => void;
  onCopyPassword: (account: VaultAccount) => void;
  onOpenApp: (account: VaultAccount) => void;
}

export const QuickAccessModal: React.FC<QuickAccessModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onCopyUser,
  onCopyPassword,
  onOpenApp,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = accounts.filter(
    (acc) =>
      acc.appName.toLowerCase().includes(query.toLowerCase()) ||
      acc.username.toLowerCase().includes(query.toLowerCase()) ||
      acc.appPath.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filtered[selectedIndex];
      if (current) {
        if (e.shiftKey) {
          onCopyUser(current);
        } else if (e.ctrlKey) {
          onOpenApp(current);
        } else {
          onCopyPassword(current);
        }
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#005A2E]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tra cứu nhanh ứng dụng, User, URL (Ctrl - Shift - Space)..."
            className="flex-1 bg-transparent border-none text-sm font-medium text-slate-800 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2 text-xs">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Không tìm thấy ứng dụng khớp với từ khóa "{query}"
            </div>
          ) : (
            filtered.map((acc, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    setSelectedIndex(index);
                    onCopyPassword(acc);
                    onClose();
                  }}
                  className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-50 border border-emerald-300' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? 'bg-[#005A2E] text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {acc.appName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-900 truncate">{acc.appName}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                        <span>User: <strong className="text-slate-700">{acc.username}</strong></span>
                        <span>·</span>
                        <span className="truncate">{acc.appPath}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyUser(acc);
                        onClose();
                      }}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 flex items-center gap-1"
                      title="Sao chép User"
                    >
                      <User className="w-3 h-3 text-slate-500" />
                      <span>User</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyPassword(acc);
                        onClose();
                      }}
                      className="px-2 py-1 bg-[#005A2E] hover:bg-[#004724] text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs"
                      title="Sao chép Mật khẩu"
                    >
                      <Key className="w-3 h-3 text-amber-300" />
                      <span>Pass</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenApp(acc);
                        onClose();
                      }}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 flex items-center gap-1"
                      title="Mở ứng dụng"
                    >
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Keyboard Shortcuts Hint Bar */}
        <div className="bg-slate-100 px-4 py-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><kbd className="bg-white px-1 border rounded shadow-xs font-mono">Enter</kbd> Copy Password</span>
            <span><kbd className="bg-white px-1 border rounded shadow-xs font-mono">Shift+Enter</kbd> Copy User</span>
            <span><kbd className="bg-white px-1 border rounded shadow-xs font-mono">Ctrl+Enter</kbd> Mở ứng dụng</span>
          </div>
          <span className="font-semibold text-[#005A2E]">Agribank Quick Access</span>
        </div>
      </div>
    </div>
  );
};
