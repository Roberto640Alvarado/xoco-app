import type { CSSProperties } from "react";
import { ChocolateBreak } from "@/design-system/components/chocolate-break";

// Pantalla que cubre el login mientras se inicia sesión: una tableta de
// chocolate que se parte y el mensaje "Iniciando sesión en Xocolatísimo".
// Aparece al instante y se queda hasta que el panel termina de abrirse.
export function LoginOverlay() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background/95 backdrop-blur-sm"
    >
      <ChocolateBreak className="w-48 sm:w-56" />
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">Iniciando sesión en Xocolatísimo</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Preparando tu panel
          <span className="choco-dots inline-flex" aria-hidden="true">
            {[0, 1, 2].map((n) => (
              <span key={n} style={{ "--n": n } as CSSProperties}>
                .
              </span>
            ))}
          </span>
        </p>
      </div>
    </div>
  );
}
