export type UserRole = "Admin" | "Operator";

export interface UsersRow {
  id: number;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  area: string;
  joinedAt: string;
}
