export type UserRole = "Admin" | "Operator";

export type UserStatus = "active" | "disabled";

export interface UsersRow {
  id: number;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  area: string;
  joinedAt: string;
  status: UserStatus;
}
