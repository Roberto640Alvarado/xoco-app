"use client";

import { useEffect, useState } from "react";

// Devuelve `value` solo después de `delayMs` sin cambios: para buscadores que
// filtran cuando la persona termina de escribir, no en cada tecla.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
