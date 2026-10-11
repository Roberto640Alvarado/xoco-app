"use client";

import { useGuideTour } from "@/features/page-guide/hooks/use-guide-tour";
import { TOURS, type GuidePage, type GuideRole } from "../content";

/** Tour guiado de una pantalla de Inventario: los pasos salen de content.ts
 * según la pantalla y el rol (ver useGuideTour). */
export function useInventoryTour(page: GuidePage, role: GuideRole, email: string | undefined) {
  return useGuideTour(`inventory:${page}`, TOURS[page][role], email);
}
