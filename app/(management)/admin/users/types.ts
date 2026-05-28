export interface User {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  department: string;
  branch: string;
  role: string;
  position: string;
  status: "active" | "inactive";
  avatarUrl: string | null;
  color: string;
  bannerGradient: string;
  lastLogin: string;
}