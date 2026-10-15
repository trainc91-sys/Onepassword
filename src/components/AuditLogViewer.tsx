import React, { useState } from 'react';
import { AuditLogEntry, AuditSeverity, AuditAction } from '../types';
import { getAuditLogs } from '../utils/storage';
import {
  X,
  FileCheck2,
  Download,
  Printer,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Clock,
  User,
  ShieldAlert,
} from 'lucide-react';

interface AuditLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { fullName: string; username: string; role: any; department: string };
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [logs] = useState<AuditLogEntry[]>(getAuditLogs());
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesSeverity && matchesAction;
  });

  const exportCsv = () => {
    const headers = [
      'ID',
      'Thời gian',
      'Cán bộ',
      'Vai trò',
      'Phòng ban',
      'Hành động',
      'Tài nguyên tác động',
      'Chi tiết thao tác',
      'IP Máy trạm',
      'Mức độ rủi ro',
      'Điều khoản ISO 27001',
    ];

    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${new Date(l.timestamp).toLocaleString('vi-VN')}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.department}"`,
      `"${l.action}"`,
      `"${l.resource.replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.clientIp}"`,
      `"${l.severity}"`,
      `"${l.isoStandardTag}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_Nhat_Ky_Kiem_Toan_Agribank_ISO27001_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#005A2E] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#8C1D2F]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <FileCheck2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                BÁO CÁO NHẬT KÝ TRUY CẬP & KIỂM TOÁN AN TOÀN (ISO/IEC 27001)
              </h3>
              <p className="text-[11px] text-emerald-200">
                Ghi nhận chi tiết lịch sử đăng nhập, sao chép mật khẩu, thay đổi tài nguyên và máy trạm
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

        {/* Filter Toolbar */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm cán bộ, ứng dụng, hành động, IP..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005A2E] focus:outline-none bg-white font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-slate-700 font-medium"
              >
                <option value="all">Tất cả hành động</option>
                <option value="LOGIN_SUCCESS">Đăng nhập thành công</option>
                <option value="LOGIN_FAILED">Đăng nhập thất bại</option>
                <option value="COPY_PASSWORD">Sao chép mật khẩu</option>
                <option value="VIEW_PASSWORD">Xem mật khẩu</option>
                <option value="ADD_ACCOUNT">Thêm tài khoản</option>
                <option value="UPDATE_ACCOUNT">Sửa tài khoản</option>
                <option value="DELETE_ACCOUNT">Xóa tài khoản</option>
                <option value="BATCH_OFFICE_LOCK">Khóa Office hàng loạt</option>
                <option value="BATCH_OFFICE_UNLOCK">Mở khóa Office</option>
                <option value="BROWSER_CLEANUP_SCRIPT">Dọn dẹp trình duyệt</option>
                <option value="USER_CREATED">Admin tạo user</option>
                <option value="USER_UPDATED">Admin sửa user</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-500 font-semibold">Rủi ro:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-slate-700 font-medium"
              >
                <option value="all">Tất cả mức độ</option>
                <option value="low">Thấp (Low)</option>
                <option value="medium">Trung bình (Medium)</option>
                <option value="high">Cao (High)</option>
                <option value="critical">Nghiêm trọng (Critical)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={exportCsv}
              className="px-3 py-2 bg-[#005A2E] hover:bg-[#004724] text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>XUẤT EXCEL / CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>IN BÁO CÁO</span>
            </button>
          </div>
        </div>

        {/* Printable Official Header */}
        <div className="hidden print:block p-4 border-b border-slate-300 text-center">
          <div className="font-serif font-black text-lg text-[#8C1D2F]">
            NGÂN HÀNG NÔNG NGHIỆP VÀ PHÁT TRIỂN NÔNG THÔN VIỆT NAM (AGRIBANK)
          </div>
          <div className="text-sm font-bold text-slate-800 uppercase mt-1">
            BÁO CÁO NHẬT KÝ KIỂM TOÁN AN TOÀN THÔNG TIN HỆ THỐNG AGRIBANK ONE PASSWORD
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Tiêu chuẩn đánh giá: ISO/IEC 27001:2022 · Ngày kết xuất:{' '}
            {new Date().toLocaleString('vi-VN')} · Người xuất: {currentUser.fullName}
          </div>
        </div>

        {/* Table Content */}
        <div className="p-4 overflow-y-auto flex-1 text-xs">
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <th className="p-2.5">Thời gian (Timestamp)</th>
                  <th className="p-2.5">Cán bộ thực hiện</th>
                  <th className="p-2.5">Hành động</th>
                  <th className="p-2.5">Tài nguyên tác động</th>
                  <th className="p-2.5">Chi tiết thao tác</th>
                  <th className="p-2.5">IP Máy trạm</th>
                  <th className="p-2.5 text-center">Mức độ rủi ro</th>
                  <th className="p-2.5">Tiêu chuẩn ISO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Không tìm thấy bản ghi kiểm toán phù hợp bộ lọc
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-800">{log.userName}</div>
                        <div className="text-[10px] text-slate-400">{log.department}</div>
                      </td>
                      <td className="p-2.5 font-semibold text-slate-700 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            log.action.includes('FAIL')
                              ? 'bg-red-100 text-red-800'
                              : log.action.includes('PASSWORD')
                              ? 'bg-amber-100 text-amber-900'
                              : log.action.includes('LOGIN')
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-2.5 font-medium text-slate-800 max-w-[160px] truncate" title={log.resource}>
                        {log.resource}
                      </td>
                      <td className="p-2.5 text-slate-600 max-w-[260px] text-[11px] leading-snug">
                        {log.details}
                      </td>
                      <td className="p-2.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {log.clientIp}
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            log.severity === 'critical'
                              ? 'bg-red-200 text-red-900 border border-red-300'
                              : log.severity === 'high'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : log.severity === 'medium'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {log.severity}
                        </span>
                      </td>
                      <td className="p-2.5 text-[10px] text-slate-500 font-mono whitespace-nowrap">
                        {log.isoStandardTag}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Printable Signature Box */}
        <div className="hidden print:grid grid-cols-3 gap-8 p-8 text-center text-xs mt-4">
          <div>
            <div className="font-bold">NGƯỜI LẬP BÁO CÁO</div>
            <div className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
            <div className="mt-16 font-semibold">{currentUser.fullName}</div>
          </div>
          <div>
            <div className="font-bold">KIỂM SOÁT VIÊN NỘI BỘ</div>
            <div className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
            <div className="mt-16 font-semibold">Trần Thị Mai</div>
          </div>
          <div>
            <div className="font-bold">TRƯỞNG PHÒNG ĐIỆN TOÁN & CNTT</div>
            <div className="text-[10px] text-slate-500 italic">(Ký và đóng dấu)</div>
            <div className="mt-16 font-semibold">Nguyễn Văn An</div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#005A2E]" />
            <span>
              Tổng số bản ghi: <strong className="text-slate-800">{filteredLogs.length}</strong> / {logs.length} bản ghi
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
