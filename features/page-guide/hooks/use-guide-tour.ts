"use client";

import { useCallback, useSyncExternalStore } from "react";
import "driver.js/dist/driver.css";
import type { TourStep } from "@/features/inventory-guide/content";

const SEEN_EVENT = "xoco:guide-tour-seen";
const seenKey = (email: string, key: string) => `xoco:guide-tour-seen:${email}:${key}`;

function readSeen(email: string | undefined, key: string): boolean {
  if (!email) return true;
  try {
    return window.localStorage.getItem(seenKey(email, key)) === "1";
  } catch {
    return true; // sin storage: no insistir con el aviso
  }
}

function markTourSeen(email: string, key: string) {
  try {
    window.localStorage.setItem(seenKey(email, key), "1");
  } catch {
    // sin storage: el aviso simplemente no se recuerda
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SEEN_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SEEN_EVENT, callback);
  };
}

function isVisible(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement && element.getClientRects().length > 0;
}

/**
 * Tour guiado con driver.js para cualquier pantalla. `key` identifica la
 * pantalla (para recordar si ya se vio) y `steps` son los pasos del rol de
 * quien mira. `start()` descarta los pasos cuyo elemento no esté en pantalla
 * (ej. columnas ocultas en móvil, botones de otro rol) y lanza el recorrido.
 * `seen` es false hasta que el usuario inicia el tour por primera vez: sirve
 * para mostrar un puntito en el botón.
 */
export function useGuideTour(key: string, steps: TourStep[], email: string | undefined) {
  const seen = useSyncExternalStore(
    subscribe,
    () => readSeen(email, key),
    () => true,
  );

  const start = useCallback(async () => {
    const { driver } = await import("driver.js");
    const visibleSteps = steps.filter((step) => !step.target || isVisible(document.querySelector(step.target)));

    const tour = driver({
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente",
      prevBtnText: "Anterior",
      doneBtnText: "Listo",
      allowClose: true,
      overlayOpacity: 0.6,
      stagePadding: 6,
      stageRadius: 10,
      popoverClass: "xoco-tour",
      steps: visibleSteps.map((step) => ({
        element: step.target,
        popover: {
          title: step.title,
          description: step.description,
          side: step.side,
          align: "start" as const,
        },
      })),
    });

    if (email) markTourSeen(email, key);
    tour.drive();
  }, [key, steps, email]);

  return { start, seen };
}
