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
  expiresAt: number;
  mustChangePassword: boolean;
}

export type LoginActionState =
  | { status: 'idle' }
  | { status: 'success'; data: SessionData }
  | { status: 'error'; error: string; code?: string };

export type RefreshActionState =
  | { status: 'success'; accessToken: string; expiresAt: number }
  | { status: 'error'; error: string };
