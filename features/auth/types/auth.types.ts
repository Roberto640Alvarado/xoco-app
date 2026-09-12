export type UserRole = "SUPER_ADMIN" | "FINANZAS" | "VENDEDOR";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  // Tienda asignada — solo presente (no null) para role=VENDEDOR, ese
  // usuario solo ve datos de esta tienda (forzado también en el
  // servidor, esto es solo para la UI).
  posConfigId: number | null;
  createdAt: string;
  // Permisos efectivos por moduleKey (panel "Permisos", Fase 3 de RBAC) —
  // solo trae los módulos dentro del techo de rol de este usuario. Una
  // llave AUSENTE se interpreta como permitida (default-allow, mismo
  // criterio que el backend) — nunca como oculta.
  permissions: Record<string, boolean>;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
