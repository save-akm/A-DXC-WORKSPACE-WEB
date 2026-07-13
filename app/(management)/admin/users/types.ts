export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'TERMINATED';

export interface UserRole {
  code: string;
  color: string;
}

export interface User {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl: string | null;
  phone: string | null;
  branch: string;        // branch.code
  department: string;    // department.code
  role: UserRole;
  position: string | null;
  commuteMinutes: number | null;
  status: UserStatus;
  twoFactorEnabled: boolean;
  notifyNewDevice: boolean;
}

export interface UsersApiResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}