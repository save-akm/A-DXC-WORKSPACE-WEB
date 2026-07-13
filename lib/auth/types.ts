export interface AuthUser {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl: string | null;
  phone: string | null;
  commuteMinutes: number | null;
  locale: string | null;
  timezone: string | null;
  branch: string;
  department: string;
  role: string;
  roleSortOrder: number;
  position: string;
  status: string;
  twoFactorEnabled?: boolean;
  notifyNewDevice?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export type LoginResponse =
  | (AuthTokens & { twoFactorRequired?: false; mustChangePassword: boolean })
  | { twoFactorRequired: true; twoFactorToken: string };

export type RefreshResponse = AuthTokens & { menus?: MenuNode[] };

export type MenuNodeType = 'GROUP' | 'MENU';
export type MenuPermission = 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT';

export interface MenuNode {
  id: string;
  code: string;
  name: string;
  type: MenuNodeType;
  path: string | null;
  icon: string | null;
  sortOrder: number;
  permissions: MenuPermission[];
  children: MenuNode[];
}

export interface SessionData {
  user: AuthUser;
  menus: MenuNode[];
  accessToken: string;
  expiresAt: number;
  mustChangePassword: boolean;
  /** Present only when mustChangePassword = true */
  pendingRefreshToken?: string;
}

export type LoginActionState =
  | { status: 'idle' }
  | { status: 'success'; data: SessionData }
  | { status: 'two-factor'; twoFactorToken: string; rememberMe: boolean }
  | { status: 'error'; error: string; code?: string };

export type UpdatePasswordActionState =
  | { status: 'idle' }
  | { status: 'success'; accessToken: string; expiresAt: number }
  | { status: 'error'; error: string };

export type RefreshActionState =
  | { status: 'success'; accessToken: string; expiresAt: number; menus?: MenuNode[] }
  | { status: 'error'; error: string };

export type ForgotPasswordActionState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; error: string };

export type ResetPasswordActionState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; error: string };
