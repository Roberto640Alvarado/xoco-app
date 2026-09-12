import type { UserRole } from "@/features/auth/types/auth.types";

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  // Tienda asignada — solo presente (no null) para role="VENDEDOR".
  posConfigId: number | null;
}

export interface CreateUserPayload {
  email: string;
  name?: string;
  role: UserRole;
  posConfigId?: number;
  password: string;
  confirmPassword: string;
}

export interface SetUserPasswordPayload {
  password: string;
  confirmPassword: string;
}

export interface UpdateUserPayload {
  email: string;
  name?: string;
  role: UserRole;
  posConfigId?: number;
}
