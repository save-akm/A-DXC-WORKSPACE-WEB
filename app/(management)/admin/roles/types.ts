export interface Role {
  id: string;
  name: string;
  description: string;
  color: string;          // tailwind bg class
  gradient: string;       // for stat/banner
  usersCount: number;
  permissionsCount: number;
  isProtected: boolean;   // system-defined, cannot delete
  createdBy: string;
  createdAt: string;
}
