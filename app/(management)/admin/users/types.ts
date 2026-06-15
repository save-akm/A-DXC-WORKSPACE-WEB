export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'TERMINATED';

export interface User {
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
  position: string | null;
  status: UserStatus;
  mustChangePassword: boolean;
}

export interface UsersApiResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}