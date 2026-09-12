import { apiGet, apiPatch } from "@/lib/api/client";
import type { RoleModuleAccessRow, SetRoleModuleAccessPayload } from "../types/permissions.types";

export function fetchPermissionsMatrix() {
  return apiGet<RoleModuleAccessRow[]>("/permissions");
}

export function setRoleModuleAccess(payload: SetRoleModuleAccessPayload) {
  return apiPatch<RoleModuleAccessRow>("/permissions", payload);
}
