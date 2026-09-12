"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserRole } from "@/features/auth/types/auth.types";

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "SUPER_ADMIN", label: "Super admin" },
  { value: "FINANZAS", label: "Finanzas" },
  { value: "VENDEDOR", label: "Vendedor" },
];

interface PermissionsRoleTabsProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

// Selector de rol del panel "Permisos" — un <Select> en vez de un
// componente de tabs nuevo (no hay ninguno en el proyecto todavía),
// mismo patrón ya usado para elegir rol en create-user-form.tsx.
export function PermissionsRoleTabs({ value, onChange }: PermissionsRoleTabsProps) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as UserRole)}>
      <SelectTrigger className="w-full sm:w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
