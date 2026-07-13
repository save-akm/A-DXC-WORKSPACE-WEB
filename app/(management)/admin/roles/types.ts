export interface Role {
  id: string;
  code: string;           // unique machine code, e.g. "MANAGER"
  name: string;
  description: string;
  color: string;          // hex, e.g. "#6366f1"
  usersCount: number;     // from _count.users (0 until backend provides it)
  permissionsCount: number; // from _count.rolePermissions
  isSystem: boolean;      // built-in role — cannot rename or delete
}
