export type SystemRole = 'admin' | 'supervisor' | 'officer' | 'auditor';

export type Permission =
  | 'view_password'
  | 'copy_credentials'
  | 'manage_accounts'
  | 'office_crypto'
  | 'view_audit_logs'
  | 'export_audit_logs'
  | 'manage_users'
  | 'browser_cleanup';

export interface SystemUser {
  id: string;
  username: string;
  fullName: string;
  department: string;
  branch: string;
  role: SystemRole;
  passwordHash: string; // SHA-256 / PBKDF2 hash
  salt: string;
  status: 'active' | 'suspended';
  permissions: Permission[];
  createdAt: string;
  lastLoginAt?: string;
}

export type AccountCategory =
  | 'core_banking'
  | 'payment_citad'
  | 'credit_risk'
  | 'accounting_treasury'
  | 'internal_portal'
  | 'database_system'
  | 'external_services';

export interface VaultAccount {
  id: string;
  appName: string;
  category: AccountCategory;
  appPath: string; // URL, intranet IP, or executable path e.g. 10.12.34.56:8080/ipcas
  username: string;
  encryptedPassword: string; // AES-256 encrypted base64
  notes?: string;
  allowedRoles?: SystemRole[];
  allowedDepartments?: string[];
  lastModified: string;
  lastModifiedBy: string;
  passwordStrength?: 'yếu' | 'trung_bình' | 'mạnh' | 'rất_mạnh';
}

export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'COPY_USER'
  | 'COPY_PASSWORD'
  | 'VIEW_PASSWORD'
  | 'OPEN_APPLICATION'
  | 'ADD_ACCOUNT'
  | 'UPDATE_ACCOUNT'
  | 'DELETE_ACCOUNT'
  | 'BATCH_OFFICE_LOCK'
  | 'BATCH_OFFICE_UNLOCK'
  | 'BROWSER_CLEANUP_SCRIPT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'EXPORT_VAULT_BACKUP'
  | 'IMPORT_VAULT_BACKUP';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO String
  userId: string;
  userName: string;
  userRole: SystemRole;
  department: string;
  action: AuditAction;
  resource: string;
  details: string;
  clientIp: string;
  severity: AuditSeverity;
  isoStandardTag:
    | 'ISO/IEC 27001 - A.9.4.2'
    | 'ISO/IEC 27001 - A.12.4.1'
    | 'ISO/IEC 27001 - A.10.1.1'
    | 'ISO/IEC 27001 - A.9.2.1'
    | 'ISO/IEC 27001 - A.9.2.6';
}

export interface OfficeFileItem {
  id: string;
  name: string;
  size: number;
  type: 'word' | 'excel' | 'pdf' | 'other';
  rawFile: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  targetPassword?: string;
  message?: string;
  resultBlob?: Blob;
  resultFileName?: string;
}
