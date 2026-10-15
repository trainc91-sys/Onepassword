import React, { useState } from 'react';
import { SystemUser, SystemRole, Permission } from '../types';
import {
  getUsers,
  saveUsers,
  addAuditLog,
  getDepartments,
  addDepartment,
  deleteDepartment,
} from '../utils/storage';
import { hashUserPassword, generateSalt, generateStrongPassword } from '../utils/crypto';
import {
  X,
  UserPlus,
  ShieldAlert,
  Users,
  CheckCircle2,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  KeyRound,
  ShieldCheck,
  Building,
  Plus,
  Settings,
  FolderPlus,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SystemUser;
}

const ALL_PERMISSIONS: { id: Permission; label: string; desc: string }[] = [
  { id: 'view_password', label: 'Xem mật khẩu', desc: 'Cho phép bấm nút Xem để hiển thị mật khẩu đã lưu' },
  { id: 'copy_credentials', label: 'Sao chép mật khẩu', desc: 'Cho phép sử dụng nút Copy User và Copy Password' },
  { id: 'manage_accounts', label: 'Quản lý tài khoản', desc: 'Cho phép Thêm mới, Sửa thông tin, Xóa tài khoản' },
  { id: 'office_crypto', label: 'Mã hóa Office hàng loạt', desc: 'Khóa / Mở mật khẩu hàng loạt cho file Word & Excel' },
  { id: 'view_audit_logs', label: 'Xem nhật ký ISO 27001', desc: 'Xem toàn bộ báo cáo lịch sử truy cập hệ thống' },
  { id: 'export_audit_logs', label: 'Xuất báo cáo kiểm toán', desc: 'Xuất dữ liệu kiểm toán phục vụ thanh tra' },
  { id: 'manage_users', label: 'Quản trị cán bộ & Admin', desc: 'Khai báo, phân quyền, sửa và xóa User & Admin' },
  { id: 'browser_cleanup', label: 'Dọn dẹp mật khẩu trình duyệt', desc: 'Tải và chạy công cụ dọn dẹp Chrome / Firefox' },
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [users, setUsers] = useState<SystemUser[]>(getUsers());
  const [departments, setDepartments] = useState<string[]>(getDepartments());
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Department quick addition / manager
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState('');

  // Form states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Phòng Khách hàng & Kế hoạch');
  const [branch, setBranch] = useState('Agribank Chi Nhánh Cà Mau');
  const [role, setRole] = useState<SystemRole>('officer');
  const [password, setPassword] = useState('Agribank@123');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([
    'view_password',
    'copy_credentials',
  ]);

  if (!isOpen) return null;

  const handleOpenAddForm = (roleType: SystemRole = 'officer') => {
    setIsEditing(true);
    setEditingUserId(null);
    setUsername('');
    setFullName('');
    setDepartment(departments[0] || 'Phòng Khách hàng & Kế hoạch');
    setBranch('Agribank Chi Nhánh Cà Mau');
    setRole(roleType);
    setPassword('Agribank@123');
    setStatus('active');
    if (roleType === 'admin') {
      setSelectedPermissions(ALL_PERMISSIONS.map((p) => p.id));
    } else {
      setSelectedPermissions(['view_password', 'copy_credentials', 'office_crypto']);
    }
  };

  const handleOpenEditForm = (u: SystemUser) => {
    setIsEditing(true);
    setEditingUserId(u.id);
    setUsername(u.username);
    setFullName(u.fullName);
    setDepartment(u.department);
    setBranch(u.branch);
    setRole(u.role);
    setPassword(''); // Leave empty unless changing
    setStatus(u.status);
    setSelectedPermissions(u.permissions);
  };

  const handleTogglePermission = (perm: Permission) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleAddNewDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newDeptInput.trim();
    if (!name) return;

    if (addDepartment(name)) {
      const updated = getDepartments();
      setDepartments(updated);
      setDepartment(name);
      setNewDeptInput('');
      setShowAddDeptModal(false);

      addAuditLog({
        userId: currentUser.username,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        department: currentUser.department,
        action: 'UPDATE_ACCOUNT',
        resource: name,
        details: `Bổ sung thêm phòng ban mới vào hệ thống: '${name}'`,
        clientIp: '10.12.18.88',
        severity: 'low',
        isoStandardTag: 'ISO/IEC 27001 - A.9.2.1',
      });
    } else {
      alert('Phòng ban này đã tồn tại trong danh mục!');
    }
  };

  const handleDeleteDept = (deptToDelete: string) => {
    if (departments.length <= 1) {
      alert('Hệ thống phải duy trì ít nhất 1 phòng ban!');
      return;
    }
    if (window.confirm(`Xác nhận xóa phòng ban "${deptToDelete}" khỏi danh mục?`)) {
      deleteDepartment(deptToDelete);
      const updated = getDepartments();
      setDepartments(updated);
      if (department === deptToDelete) {
        setDepartment(updated[0]);
      }
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) {
      alert('Vui lòng nhập đủ Tên đăng nhập và Họ tên cán bộ');
      return;
    }

    const currentUsers = getUsers();

    if (editingUserId) {
      // Update existing
      const existing = currentUsers.find((u) => u.id === editingUserId);
      if (!existing) return;

      let newHash = existing.passwordHash;
      let salt = existing.salt;
      if (password.trim()) {
        salt = generateSalt();
        newHash = await hashUserPassword(password.trim(), salt);
      }

      const updatedUsers = currentUsers.map((u) => {
        if (u.id === editingUserId) {
          return {
            ...u,
            fullName: fullName.trim(),
            department,
            branch,
            role,
            status,
            permissions: role === 'admin' ? ALL_PERMISSIONS.map((p) => p.id) : selectedPermissions,
            passwordHash: newHash,
            salt,
          };
        }
        return u;
      });

      saveUsers(updatedUsers);
      setUsers(updatedUsers);
      setIsEditing(false);

      addAuditLog({
        userId: currentUser.username,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        department: currentUser.department,
        action: 'USER_UPDATED',
        resource: username,
        details: `Cập nhật thông tin và phân quyền cho ${role === 'admin' ? 'Quản trị viên (Admin)' : 'cán bộ'} '${fullName}' (${department})`,
        clientIp: '10.12.18.88',
        severity: 'medium',
        isoStandardTag: 'ISO/IEC 27001 - A.9.2.1',
      });
    } else {
      // Create new
      if (currentUsers.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
        alert('Tên đăng nhập này đã tồn tại trên hệ thống!');
        return;
      }

      const salt = generateSalt();
      const passwordHash = await hashUserPassword(password.trim() || 'Agribank@123', salt);

      const newUser: SystemUser = {
        id: `usr-${Date.now()}`,
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        department,
        branch,
        role,
        passwordHash,
        salt,
        status,
        permissions: role === 'admin' ? ALL_PERMISSIONS.map((p) => p.id) : selectedPermissions,
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = [...currentUsers, newUser];
      saveUsers(updatedUsers);
      setUsers(updatedUsers);
      setIsEditing(false);

      addAuditLog({
        userId: currentUser.username,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        department: currentUser.department,
        action: 'USER_CREATED',
        resource: newUser.username,
        details: `Khai báo tài khoản mới: '${newUser.fullName}' - Vai trò: ${newUser.role} (Admin/User) - Phòng ban: ${newUser.department}`,
        clientIp: '10.12.18.88',
        severity: 'high',
        isoStandardTag: 'ISO/IEC 27001 - A.9.2.1',
      });
    }
  };

  const handleToggleStatus = (u: SystemUser) => {
    const activeAdmins = users.filter((usr) => usr.role === 'admin' && usr.status === 'active');
    if (u.role === 'admin' && u.status === 'active' && activeAdmins.length <= 1) {
      alert('Không thể khóa Quản trị viên này! Hệ thống bắt buộc phải có ít nhất 01 Quản trị viên (Admin) đang hoạt động.');
      return;
    }

    const newStatus = u.status === 'active' ? 'suspended' : 'active';
    const updated = users.map((usr) => (usr.id === u.id ? { ...usr, status: newStatus as any } : usr));
    saveUsers(updated);
    setUsers(updated);

    addAuditLog({
      userId: currentUser.username,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      department: currentUser.department,
      action: 'USER_UPDATED',
      resource: u.username,
      details: `${newStatus === 'active' ? 'Mở khóa' : 'Tạm khóa'} tài khoản '${u.fullName}' (${u.role})`,
      clientIp: '10.12.18.88',
      severity: 'high',
      isoStandardTag: 'ISO/IEC 27001 - A.9.2.1',
    });
  };

  const handleDeleteUser = (u: SystemUser) => {
    // Safety guard: Must retain at least 1 Admin
    const activeAdmins = users.filter((usr) => usr.role === 'admin');
    if (u.role === 'admin' && activeAdmins.length <= 1) {
      alert('Không thể xóa Quản trị viên này! Hệ thống bắt buộc phải duy trì ít nhất 01 Quản trị viên (Admin) để quản lý.');
      return;
    }

    const confirmMsg = u.role === 'admin'
      ? `CẢNH BÁO: Xác nhận xóa vĩnh viễn tài khoản QUẢN TRỊ VIÊN (ADMIN) "${u.fullName}" (@${u.username})?`
      : `Xác nhận xóa tài khoản cán bộ "${u.fullName}" (@${u.username}) khỏi hệ thống?`;

    if (window.confirm(confirmMsg)) {
      const updated = users.filter((usr) => usr.id !== u.id);
      saveUsers(updated);
      setUsers(updated);

      addAuditLog({
        userId: currentUser.username,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        department: currentUser.department,
        action: 'USER_DELETED',
        resource: u.username,
        details: `Đã thu hồi và xóa tài khoản ${u.role === 'admin' ? 'QUẢN TRỊ VIÊN' : 'cán bộ'} '${u.fullName}'`,
        clientIp: '10.12.18.88',
        severity: 'high',
        isoStandardTag: 'ISO/IEC 27001 - A.9.2.6',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#005A2E] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#8C1D2F]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <Users className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                QUẢN LÝ CÁN BỘ & QUẢN TRỊ VIÊN (ADMIN) · PHÂN QUYỀN RBAC
              </h3>
              <p className="text-[11px] text-emerald-200">
                Thêm, sửa, xóa User sử dụng & User Admin · Bổ sung phòng ban linh hoạt · Chuẩn ISO 27001
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

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {!isEditing ? (
            /* User Table List */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-slate-600 font-semibold flex items-center gap-2">
                  <span>
                    Tổng số tài khoản: <strong className="text-slate-900">{users.length}</strong>
                  </span>
                  <span>·</span>
                  <span className="text-[#8C1D2F] font-bold">
                    {users.filter((u) => u.role === 'admin').length} Quản trị viên (Admin)
                  </span>
                  <span>·</span>
                  <span className="text-[#005A2E] font-bold">
                    {users.filter((u) => u.role !== 'admin').length} Cán bộ nghiệp vụ
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Department Manager Button */}
                  <button
                    type="button"
                    onClick={() => setShowAddDeptModal(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Building className="w-4 h-4 text-emerald-700" />
                    <span>+ BỔ SUNG PHÒNG BAN ({departments.length})</span>
                  </button>

                  {/* Add Admin Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenAddForm('admin')}
                    className="px-3 py-1.5 bg-[#8C1D2F] hover:bg-[#741524] text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>+ THÊM ADMIN</span>
                  </button>

                  {/* Add Regular User Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenAddForm('officer')}
                    className="px-3.5 py-1.5 bg-[#005A2E] hover:bg-[#004724] text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-amber-300" />
                    <span>+ THÊM CÁN BỘ</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <th className="p-2.5">Cán bộ / Tên đăng nhập</th>
                      <th className="p-2.5">Phòng ban & Chi nhánh</th>
                      <th className="p-2.5">Vai trò</th>
                      <th className="p-2.5">Quyền hạn được cấp</th>
                      <th className="p-2.5 text-center">Trạng thái</th>
                      <th className="p-2.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-medium">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.fullName}</span>
                            {u.role === 'admin' && (
                              <span className="text-[10px] bg-red-50 text-[#8C1D2F] px-1.5 py-0.2 rounded font-bold border border-red-200">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">@{u.username}</div>
                        </td>
                        <td className="p-2.5 text-slate-600">
                          <div className="font-medium text-slate-800">{u.department}</div>
                          <div className="text-[10px] text-slate-400">{u.branch}</div>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-red-100 text-[#8C1D2F] border border-red-200'
                                : u.role === 'supervisor'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : u.role === 'auditor'
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            }`}
                          >
                            {u.role === 'admin' && 'Quản trị viên (Admin)'}
                            {u.role === 'supervisor' && 'Kiểm soát viên'}
                            {u.role === 'auditor' && 'Kiểm toán viên'}
                            {u.role === 'officer' && 'Cán bộ nghiệp vụ'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600">
                          <span className="font-semibold text-slate-800">
                            {u.role === 'admin' ? 'Toàn quyền (8/8)' : `${u.permissions.length} quyền`}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {u.status === 'active' ? 'Đang hoạt động' : 'Tạm khóa'}
                          </span>
                        </td>
                        <td className="p-2.5 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(u)}
                            className="p-1 text-slate-600 hover:text-[#005A2E] hover:bg-slate-100 rounded"
                            title="Sửa thông tin & phân quyền"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className="p-1 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded"
                            title={u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {u.status === 'active' ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </button>
                          {/* DELETE BUTTON for ALL users and admins */}
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title={`Xóa tài khoản ${u.role === 'admin' ? 'Quản trị viên' : 'cán bộ'}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Add / Edit User Form */
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-sm text-[#005A2E]">
                  {editingUserId
                    ? `CẬP NHẬT THÔNG TIN & PHÂN QUYỀN: ${username}`
                    : role === 'admin'
                    ? 'KHAI BÁO QUẢN TRỊ VIÊN (ADMIN) MỚI'
                    : 'KHAI BÁO CÁN BỘ MỚI'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:underline"
                >
                  ← Quay lại danh sách
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tên đăng nhập (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUserId}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="VD: trainguyencong1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005A2E] focus:outline-none font-mono text-xs bg-white disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Họ và tên cán bộ / Quản trị viên *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Nguyễn Công Trái"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005A2E] focus:outline-none text-xs bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Phòng ban công tác *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddDeptModal(true)}
                      className="text-xs text-[#005A2E] hover:underline font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Bổ sung phòng ban
                    </button>
                  </div>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005A2E] focus:outline-none text-xs bg-white font-medium"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Chi nhánh / Đơn vị *
                  </label>
                  <input
                    type="text"
                    required
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="Agribank Chi Nhánh Cà Mau"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005A2E] focus:outline-none text-xs bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Vai trò hệ thống (Role) *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const newRole = e.target.value as SystemRole;
                      setRole(newRole);
                      if (newRole === 'admin') {
                        setSelectedPermissions(ALL_PERMISSIONS.map((p) => p.id));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005A2E] focus:outline-none text-xs bg-white font-bold text-[#8C1D2F]"
                  >
                    <option value="officer">Cán bộ tác nghiệp (Tín dụng / Giao dịch viên)</option>
                    <option value="supervisor">Trưởng phòng / Kiểm soát viên</option>
                    <option value="auditor">Kiểm toán viên nội bộ</option>
                    <option value="admin">Quản trị viên hệ thống (Super Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {editingUserId ? 'Đổi mật khẩu (bỏ trống nếu giữ nguyên)' : 'Mật khẩu đăng nhập ban đầu *'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingUserId ? 'Để trống nếu không đổi' : 'Nhập mật khẩu (VD: Agribank@123)'}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005A2E] focus:outline-none text-xs font-mono bg-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPassword(
                          generateStrongPassword({
                            length: 14,
                            includeUppercase: true,
                            includeLowercase: true,
                            includeNumbers: true,
                            includeSymbols: true,
                          })
                        )
                      }
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 font-semibold text-[11px]"
                    >
                      Sinh mật khẩu
                    </button>
                  </div>
                </div>
              </div>

              {/* Granular Permission Checkboxes */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Phân quyền thao tác chi tiết:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label
                      key={perm.id}
                      className={`flex items-start gap-2.5 p-2.5 border rounded-lg cursor-pointer transition-colors ${
                        selectedPermissions.includes(perm.id) || role === 'admin'
                          ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id) || role === 'admin'}
                        disabled={role === 'admin'}
                        onChange={() => handleTogglePermission(perm.id)}
                        className="mt-0.5 rounded text-[#005A2E] focus:ring-[#005A2E]"
                      />
                      <div>
                        <div className="font-bold text-xs">{perm.label}</div>
                        <div className="text-[11px] text-slate-500">{perm.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005A2E] hover:bg-[#004724] text-white font-bold rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>
                    {editingUserId
                      ? 'LƯU CẬP NHẬT TÀI KHOẢN'
                      : role === 'admin'
                      ? 'LƯU QUẢN TRỊ VIÊN (ADMIN) MỚI'
                      : 'LƯU CÁN BỘ MỚI'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#005A2E]" />
            <span>Phân quyền dựa trên vai trò (RBAC) · Quản lý User & Admin · ISO/IEC 27001</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Pop-up Sub-modal: Bổ sung & Quản lý phòng ban */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-[#005A2E] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#8C1D2F]">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-300" />
                <h4 className="font-bold text-xs uppercase tracking-wide">
                  BỔ SUNG & QUẢN LÝ PHÒNG BAN CÁN BỘ
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDeptModal(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Form Add New Department */}
              <form onSubmit={handleAddNewDepartment} className="space-y-2">
                <label className="block font-bold text-slate-700 uppercase">
                  Tên phòng ban mới cần bổ sung:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newDeptInput}
                    onChange={(e) => setNewDeptInput(e.target.value)}
                    placeholder="VD: Ban Pháp chế, Phòng Giao dịch Cái Nước..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005A2E] focus:outline-none bg-white font-medium text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#005A2E] hover:bg-[#004724] text-white font-bold rounded-lg shadow-xs flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm</span>
                  </button>
                </div>
              </form>

              {/* Existing Departments List */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-700 uppercase text-[11px] flex justify-between">
                  <span>Danh mục phòng ban hiện có ({departments.length}):</span>
                </div>
                <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50/50">
                  {departments.map((dept) => (
                    <div
                      key={dept}
                      className="p-2 flex items-center justify-between gap-2 hover:bg-white transition-colors"
                    >
                      <span className="font-medium text-slate-800">{dept}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteDept(dept)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Xóa phòng ban này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddDeptModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs cursor-pointer"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
