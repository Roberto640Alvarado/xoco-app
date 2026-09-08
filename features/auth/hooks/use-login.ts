"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { loginRequest } from "../api/auth.api";
import { useAuthStore } from "@/store/auth-store";
import { getDashboardPath } from "../utils/get-dashboard-path";
import type { LoginFormValues } from "../schemas/login.schema";
import type { AuthUser } from "../types/auth.types";
import type { ApiError } from "@/lib/api/client";

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<AuthUser, ApiError, LoginFormValues>({
    mutationFn: async (payload) => {
      const { accessToken, user } = await loginRequest(payload);

      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });

      setSession(accessToken, user);
      return user;
    },
    onSuccess: () => {
      const redirect = searchParams.get("redirect");
      router.push(redirect && redirect.startsWith("/") ? redirect : getDashboardPath());
      router.refresh();
    },
  });
}
