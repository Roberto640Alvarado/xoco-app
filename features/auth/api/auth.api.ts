import { apiGet, apiPost } from "@/lib/api/client";
import type { AuthResponse, AuthUser } from "../types/auth.types";
import type { LoginFormValues } from "../schemas/login.schema";

export function loginRequest(payload: LoginFormValues) {
  return apiPost<AuthResponse>("/auth/login", payload);
}

export function meRequest() {
  return apiGet<AuthUser>("/auth/me");
}
