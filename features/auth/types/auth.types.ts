export type UserRole = "SUPER_ADMIN" | "FINANZAS";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
