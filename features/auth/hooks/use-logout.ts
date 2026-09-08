"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export function useLogout() {
  const router = useRouter();
  const clear = useAuthStore((state) => state.clear);

  return async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
    clear();
    router.push("/login");
    router.refresh();
  };
}
