"use client";

import { useCallback, useSyncExternalStore } from "react";
import "driver.js/dist/driver.css";
import { TOURS, type GuidePage, type GuideRole } from "../content";

const SEEN_EVENT = "xoco:inventory-tour-seen";
const seenKey = (email: string, page: GuidePage) => `xoco:inventory-tour-seen:${email}:${page}`;

function readSeen(email: string | undefined, page: GuidePage): boolean {
  if (!email) return true;
  try {
    return window.localStorage.getItem(seenKey(email, page)) === "1";
  } catch {
    return true; // sin storage: no insistir con el aviso
  }
}

function markTourSeen(email: string, page: GuidePage) {
  try {
    window.localStorage.setItem(seenKey(email, page), "1");
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
 * Tour guiado de una pantalla de Inventario con driver.js. `start()` arma los
 * pasos del contenido (content.ts) descartando los que apuntan a algo que no
 * está en pantalla (ej. columnas ocultas en móvil, botones de otro rol) y lo
 * lanza. `seen` es false hasta que el usuario inicia el tour de esa pantalla
 * por primera vez — sirve para mostrar un puntito en el botón.
 */
export function useInventoryTour(page: GuidePage, role: GuideRole, email: string | undefined) {
  const seen = useSyncExternalStore(
    subscribe,
    () => readSeen(email, page),
    () => true,
  );

  const start = useCallback(async () => {
    const { driver } = await import("driver.js");
    const steps = TOURS[page][role].filter((step) => !step.target || isVisible(document.querySelector(step.target)));

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
      steps: steps.map((step) => ({
        element: step.target,
        popover: {
          title: step.title,
          description: step.description,
          side: step.side,
          align: "start" as const,
        },
      })),
    });

    if (email) markTourSeen(email, page);
    tour.drive();
  }, [page, role, email]);

  return { start, seen };
}
