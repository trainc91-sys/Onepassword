import { SystemUser, VaultAccount, AuditLogEntry, Permission, SystemRole } from '../types';
import { hashUserPassword } from './crypto';

const STORAGE_KEYS = {
  USERS: 'AGRIBANK_ONE_PASS_USERS_V1',
  VAULT: 'AGRIBANK_ONE_PASS_VAULT_V1',
  AUDIT: 'AGRIBANK_ONE_PASS_AUDIT_V1',
  SESSION: 'AGRIBANK_ONE_PASS_SESSION_V1',
  MASTER_KEY: 'AGRIBANK_ONE_PASS_MASTER_KEY_V1',
  DEPARTMENTS: 'AGRIBANK_ONE_PASS_DEPARTMENTS_V1',
};

// Default Initial Master Secret for AES Vault
export const DEFAULT_MASTER_KEY = 'Agribank@OnePass@2026#SecuredIntranet';

// Initial Mock Users
export const INITIAL_USERS: SystemUser[] = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    fullName: 'Quản Trị Viên Hệ Thống',
    department: 'Phòng Điện toán & CNTT',
    branch: 'Hội Sở Agribank',
    role: 'admin',
    // Pre-computed hash of 'Agribank@2026' with salt 'agrisalt2026'
    salt: 'agrisalt2026',
    passwordHash: '', // Will be initialized or checked
    status: 'active',
    permissions: [
      'view_password',
      'copy_credentials',
      'manage_accounts',
      'office_crypto',
      'view_audit_logs',
      'export_audit_logs',
      'manage_users',
      'browser_cleanup',
    ],
    createdAt: '2026-01-01T08:00:00.000Z',
    lastLoginAt: '2026-10-15T06:45:00.000Z',
  },
  {
    id: 'usr-trai-02',
    username: 'trainguyencong1',
    fullName: 'Nguyễn Công Trái',
    department: 'Phòng Khách hàng & Kế hoạch',
    branch: 'Agribank Chi Nhánh Cà Mau',
    role: 'officer',
    salt: 'agrisalttrai',
    passwordHash: '',
    status: 'active',
    permissions: [
      'view_password',
      'copy_credentials',
      'manage_accounts',
      'office_crypto',
      'browser_cleanup',
    ],
    createdAt: '2026-01-10T08:30:00.000Z',
    lastLoginAt: '2026-10-15T06:50:00.000Z',
  },
  {
    id: 'usr-audit-03',
    username: 'kiemsoatvien',
    fullName: 'Trần Thị Mai',
    department: 'Phòng Kiểm tra Kiểm soát Nội bộ',
    branch: 'Agribank Chi Nhánh Cà Mau',
    role: 'auditor',
    salt: 'agrisaltaudit',
    passwordHash: '',
    status: 'active',
    permissions: [
      'view_audit_logs',
      'export_audit_logs',
      'view_password',
      'browser_cleanup',
    ],
    createdAt: '2026-02-01T09:00:00.000Z',
    lastLoginAt: '2026-10-14T16:20:00.000Z',
  },
];

// Initial Accounts
export const INITIAL_ACCOUNTS: VaultAccount[] = [
  {
    id: 'acc-ipcas-01',
    appName: 'IPCAS II - Core Banking Agribank',
    category: 'core_banking',
    appPath: 'http://10.12.18.25:8080/ipcas/login',
    username: 'trai.nc_ca_mau',
    encryptedPassword: '', // Will encrypt during init
    notes: 'Tài khoản giao dịch tiền gửi, tiền vay, kế toán tổng hợp trên máy trạm nội bộ',
    allowedRoles: ['admin', 'supervisor', 'officer'],
    lastModified: '2026-10-12T09:15:00.000Z',
    lastModifiedBy: 'trainguyencong1',
    passwordStrength: 'rất_mạnh',
  },
  {
    id: 'acc-citad-02',
    appName: 'Thanh toán Điện tử Liên ngân hàng (CITAD - NHNN)',
    category: 'payment_citad',
    appPath: 'https://10.0.8.100/citad/portal',
    username: 'citad_agri_cm91',
    encryptedPassword: '',
    notes: 'Kênh chuyển tiền liên ngân hàng thời gian thực qua Ngân hàng Nhà nước',
    allowedRoles: ['admin', 'supervisor', 'officer'],
    lastModified: '2026-10-10T14:20:00.000Z',
    lastModifiedBy: 'admin',
    passwordStrength: 'rất_mạnh',
  },
  {
    id: 'acc-cris-03',
    appName: 'Hệ thống Xếp hạng Tín dụng Nội bộ (CRIS)',
    category: 'credit_risk',
    appPath: 'http://10.12.100.45/cris/eval',
    username: 'trainguyencong1',
    encryptedPassword: '',
    notes: 'Đánh giá xếp hạng rủi ro khách hàng vay vốn và lập báo cáo thẩm định tín dụng',
    allowedRoles: ['admin', 'supervisor', 'officer'],
    lastModified: '2026-10-14T11:00:00.000Z',
    lastModifiedBy: 'trainguyencong1',
    passwordStrength: 'mạnh',
  },
  {
    id: 'acc-arms-04',
    appName: 'Phần mềm Định giá Tài sản Thế chấp (ARMS)',
    category: 'credit_risk',
    appPath: 'http://10.12.100.52/arms/valuation',
    username: 'td_cm_trainc',
    encryptedPassword: '',
    notes: 'Tra cứu khung định giá đất đai, nhà ở, xe ô tô, kho bãi đảm bảo tiền vay',
    allowedRoles: ['admin', 'supervisor', 'officer'],
    lastModified: '2026-10-11T15:30:00.000Z',
    lastModifiedBy: 'trainguyencong1',
    passwordStrength: 'mạnh',
  },
  {
    id: 'acc-eoffice-05',
    appName: 'Cổng Quản lý Văn bản & Điều hành E-Office',
    category: 'internal_portal',
    appPath: 'https://eoffice.agribank.com.vn',
    username: 'trai.nc@agribank.com.vn',
    encryptedPassword: '',
    notes: 'Ký số văn bản điện tử, trình duyệt tờ trình, lịch tuần và chỉ đạo điều hành',
    allowedRoles: ['admin', 'supervisor', 'officer', 'auditor'],
    lastModified: '2026-10-13T08:00:00.000Z',
    lastModifiedBy: 'admin',
    passwordStrength: 'mạnh',
  },
  {
    id: 'acc-tcs-06',
    appName: 'Hệ thống Thu ngân sách Nhà nước (TCS - Kho Bạc)',
    category: 'accounting_treasury',
    appPath: 'http://10.12.22.80/tcs/kbnn',
    username: 'tcs_gd_camau01',
    encryptedPassword: '',
    notes: 'Cổng thông quan thu thuế điện tử hải quan, thuế nội địa phối hợp Kho bạc Nhà nước',
    allowedRoles: ['admin', 'supervisor', 'officer'],
    lastModified: '2026-10-09T10:45:00.000Z',
    lastModifiedBy: 'admin',
    passwordStrength: 'rất_mạnh',
  },
  {
    id: 'acc-mail-07',
    appName: 'Hộp thư Công vụ Agribank Webmail (Exchange)',
    category: 'internal_portal',
    appPath: 'https://mail.agribank.com.vn/owa',
    username: 'trainguyencong1',
    encryptedPassword: '',
    notes: 'Hộp thư điện tử bảo mật trao đổi thông tin nghiệp vụ nội bộ toàn hệ thống',
    allowedRoles: ['admin', 'supervisor', 'officer', 'auditor'],
    lastModified: '2026-10-05T09:00:00.000Z',
    lastModifiedBy: 'trainguyencong1',
    passwordStrength: 'mạnh',
  },
];

// Initial Audit Logs (Demonstrating ISO/IEC 27001 Compliance)
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: '2026-10-15T06:45:10.120Z',
    userId: 'usr-admin-01',
    userName: 'admin (Quản trị viên)',
    userRole: 'admin',
    department: 'Phòng Điện toán & CNTT',
    action: 'LOGIN_SUCCESS',
    resource: 'Agribank One Password Intranet Portal',
    details: 'Đăng nhập thành công từ máy trạm nội bộ IP 10.12.18.102',
    clientIp: '10.12.18.102',
    severity: 'low',
    isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
  },
  {
    id: 'aud-002',
    timestamp: '2026-10-15T06:48:32.450Z',
    userId: 'usr-admin-01',
    userName: 'admin (Quản trị viên)',
    userRole: 'admin',
    department: 'Phòng Điện toán & CNTT',
    action: 'USER_UPDATED',
    resource: 'trainguyencong1',
    details: 'Cập nhật phân quyền truy cập: Thêm quyền Office Crypto và Quản lý tài khoản',
    clientIp: '10.12.18.102',
    severity: 'medium',
    isoStandardTag: 'ISO/IEC 27001 - A.9.2.1',
  },
  {
    id: 'aud-003',
    timestamp: '2026-10-15T06:50:02.890Z',
    userId: 'usr-trai-02',
    userName: 'trainguyencong1 (Nguyễn Công Trái)',
    userRole: 'officer',
    department: 'Phòng Khách hàng & Kế hoạch',
    action: 'LOGIN_SUCCESS',
    resource: 'Agribank One Password Client',
    details: 'Xác thực tài khoản thành công qua mật khẩu cấp phép nội bộ',
    clientIp: '10.12.18.88',
    severity: 'low',
    isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
  },
  {
    id: 'aud-004',
    timestamp: '2026-10-15T06:51:15.300Z',
    userId: 'usr-trai-02',
    userName: 'trainguyencong1 (Nguyễn Công Trái)',
    userRole: 'officer',
    department: 'Phòng Khách hàng & Kế hoạch',
    action: 'COPY_PASSWORD',
    resource: 'IPCAS II - Core Banking Agribank',
    details: 'Sao chép mật khẩu vào bộ đệm clipboard an toàn (tự hủy sau 30 giây)',
    clientIp: '10.12.18.88',
    severity: 'medium',
    isoStandardTag: 'ISO/IEC 27001 - A.9.4.2',
  },
];

export async function initializeDatabase() {
  const masterKey = getMasterKey();

  // 1. Initialize Users or Migrate existing
  const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!existingUsers) {
    // Generate valid password hashes for initial users
    const users = await Promise.all(
      INITIAL_USERS.map(async (u) => {
        const pass = u.username === 'admin' ? 'Agribank@2026' : 'Agribank@123';
        const hash = await hashUserPassword(pass, u.salt);
        return { ...u, passwordHash: hash };
      })
    );
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } else {
    // Migrate existing users if they contain cuongthaiquoc
    try {
      const parsedUsers: SystemUser[] = JSON.parse(existingUsers);
      let changed = false;
      const migratedUsers = await Promise.all(
        parsedUsers.map(async (u) => {
          if (u.username === 'cuongthaiquoc' || u.id === 'usr-cuong-02') {
            changed = true;
            const salt = 'agrisalttrai';
            const hash = await hashUserPassword('Agribank@123', salt);
            return {
              ...u,
              id: 'usr-trai-02',
              username: 'trainguyencong1',
              fullName: 'Nguyễn Công Trái',
              salt,
              passwordHash: hash,
            };
          }
          return u;
        })
      );
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(migratedUsers));
      }
    } catch {
      // Ignore
    }
  }

  // Also migrate current session if it was cuongthaiquoc
  try {
    const rawSession = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (rawSession) {
      const session = JSON.parse(rawSession);
      if (session.username === 'cuongthaiquoc') {
        session.id = 'usr-trai-02';
        session.username = 'trainguyencong1';
        session.fullName = 'Nguyễn Công Trái';
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      }
    }
  } catch {
    // Ignore
  }

  // 2. Initialize Accounts
  const existingVault = localStorage.getItem(STORAGE_KEYS.VAULT);
  if (!existingVault) {
    const { encryptText } = await import('./crypto');
    const demoPasswords: Record<string, string> = {
      'acc-ipcas-01': 'Agri#Ipcas@9981!',
      'acc-citad-02': 'Citad#Agri$2026%',
      'acc-cris-03': 'Cris#Credit@8834^',
      'acc-arms-04': 'Arms#Valuate*7762',
      'acc-eoffice-05': 'Eoffice#Agri&4431',
      'acc-tcs-06': 'Tcs#Treasury#1129!',
      'acc-mail-07': 'Mail#Secure@3398*',
    };

    const accounts = await Promise.all(
      INITIAL_ACCOUNTS.map(async (acc) => {
        const plain = demoPasswords[acc.id] || 'AgriPassword@2026';
        const encrypted = await encryptText(plain, masterKey);
        return { ...acc, encryptedPassword: encrypted };
      })
    );
    localStorage.setItem(STORAGE_KEYS.VAULT, JSON.stringify(accounts));
  }

  // 3. Initialize Audit Logs
  const existingAudit = localStorage.getItem(STORAGE_KEYS.AUDIT);
  if (!existingAudit) {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT_LOGS));
  }
}

export function getMasterKey(): string {
  const key = localStorage.getItem(STORAGE_KEYS.MASTER_KEY);
  if (!key) {
    localStorage.setItem(STORAGE_KEYS.MASTER_KEY, DEFAULT_MASTER_KEY);
    return DEFAULT_MASTER_KEY;
  }
  return key;
}

export function setMasterKey(newKey: string): void {
  localStorage.setItem(STORAGE_KEYS.MASTER_KEY, newKey);
}

// User Repository
export function getUsers(): SystemUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUsers(users: SystemUser[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// Account Repository
export function getAccounts(): VaultAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VAULT);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: VaultAccount[]): void {
  localStorage.setItem(STORAGE_KEYS.VAULT, JSON.stringify(accounts));
}

// Audit Repository
export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  const current = getAuditLogs();
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };
  current.unshift(newEntry);
  // Keep up to 2000 log entries for performance in local storage
  if (current.length > 2000) current.length = 2000;
  localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(current));
}

// Session State
export function getCurrentSession(): SystemUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentSession(user: SystemUser | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

// Permission Checker
export function hasPermission(user: SystemUser | null, permission: Permission): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.permissions.includes(permission);
}

// Department Management (Phòng ban cán bộ)
export const DEFAULT_DEPARTMENTS: string[] = [
  'Phòng Khách hàng & Kế hoạch',
  'Phòng Kế toán & Ngân quỹ',
  'Phòng Thẩm định & Quản lý rủi ro',
  'Phòng Kiểm tra Kiểm soát Nội bộ',
  'Phòng Điện toán & CNTT',
  'Ban Giám đốc Chi nhánh',
  'Phòng Khách hàng Doanh nghiệp',
  'Phòng Khách hàng Cá nhân',
  'Phòng Quản lý và Thu hồi nợ',
  'Phòng Tổng hợp & Hành chính',
  'Phòng Giao dịch số 1',
  'Phòng Giao dịch số 2',
];

export function getDepartments(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(DEFAULT_DEPARTMENTS));
      return DEFAULT_DEPARTMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DEPARTMENTS;
  }
}

export function saveDepartments(depts: string[]): void {
  localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(depts));
}

export function addDepartment(deptName: string): boolean {
  const trimmed = deptName.trim();
  if (!trimmed) return false;
  const current = getDepartments();
  if (current.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
    return false; // already exists
  }
  const updated = [...current, trimmed];
  saveDepartments(updated);
  return true;
}

export function deleteDepartment(deptName: string): void {
  const current = getDepartments();
  const updated = current.filter((d) => d !== deptName);
  saveDepartments(updated);
}

