"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { SkyToggle } from "@/components/ui/sky-toggle";

interface ThemeToggleProps {
  className?: string;
}

// Interruptor claro/oscuro (cielo de día / de noche) sobre next-themes (ver
// app/providers.tsx). Vive en la esquina superior derecha del header. El
// guard de `mounted` evita el mismatch de hidratación: el servidor no sabe
// qué tema eligió el usuario, así que hasta montar se pinta deshabilitado.
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <SkyToggle
      className={className}
      checked={isDark}
      disabled={!mounted}
      onCheckedChange={(dark) => setTheme(dark ? "dark" : "light")}
    />
  );
}
