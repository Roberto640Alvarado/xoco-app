import type { UserRole } from "@/features/auth/types/auth.types";

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserPayload {
  email: string;
  name?: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
}

export interface SetUserPasswordPayload {
  password: string;
  confirmPassword: string;
}
