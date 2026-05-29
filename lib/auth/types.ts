export interface AuthUser {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl: string | null;
  phone: string | null;
  branch: string;
  department: string;
  role: string;
  position: string;
  status: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse extends AuthTokens {
  mustChangePassword: boolean;
}

export type RefreshResponse = AuthTokens;

export type MenuNodeType = 'GROUP' | 'MENU';

export interface MenuNode {
  id: string;
  code: string;
  name: string;
  type: MenuNodeType;
  path: string | null;
  icon: string | null;
  sortOrder: number;
  children: MenuNode[];
}

export interface SessionData {
  user: AuthUser;
  menus: MenuNode[];
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  mustChangePassword: boolean;
  /** Present only when mustChangePassword = true — used to activate the cookie after password update */
  pendingRefreshToken?: string;
}

export type LoginActionState =
  | { status: 'idle' }
  | { status: 'success'; data: SessionData }
  | { status: 'error'; error: string; code?: string };

export type UpdatePasswordActionState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; error: string };

export type RefreshActionState =
  | { status: 'success'; accessToken: string; expiresAt: number; refreshToken: string }
  | { status: 'error'; error: string };

export type ForgotPasswordActionState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; error: string };

export type ResetPasswordActionState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; error: string };
