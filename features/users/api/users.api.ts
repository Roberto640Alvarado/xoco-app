import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { AppUser, CreateUserPayload, SetUserPasswordPayload } from "../types/users.types";

export function fetchUsers() {
  return apiGet<AppUser[]>("/users");
}

export function createUser(payload: CreateUserPayload) {
  return apiPost<AppUser>("/users", payload);
}

export function setUserActive(id: string, isActive: boolean) {
  return apiPatch<AppUser>(`/users/${id}/active`, { isActive });
}

export function setUserPassword(id: string, payload: SetUserPasswordPayload) {
  return apiPatch<AppUser>(`/users/${id}/password`, payload);
}
