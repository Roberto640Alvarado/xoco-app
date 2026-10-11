"use client";

import type { ReactNode } from "react";
import { SectionCard } from "@/design-system/components/section-card";
import { guideRoleFor } from "@/features/inventory-guide/content";
import { useAuthStore } from "@/store/auth-store";
import { briefFor, REPORT_GUIDES, type ReportPageKey } from "../content";
import { PageGuideBar } from "./page-guide-bar";

interface ReportHeaderProps {
  page: ReportPageKey;
  /** Los controles de la sección: fechas, tienda, botones y exportar. */
  children?: ReactNode;
}

/**
 * Encabezado estándar de las secciones de reportes: la card del tour guiado
 * y, debajo, la SectionCard con ícono, título, una frase corta según el rol y
 * los controles de la pantalla. Es lo primero de cada reporte; el tour usa su
 * ancla `report-header` y los bloques que le siguen.
 */
export function ReportHeader({ page, children }: ReportHeaderProps) {
  const role = guideRoleFor(useAuthStore((state) => state.user?.role));
  const guide = REPORT_GUIDES[page];
  return (
    <>
      <PageGuideBar page={page} />
      <SectionCard icon={guide.icon} title={guide.title} description={briefFor(page, role)} tourId="report-header">
        {children}
      </SectionCard>
    </>
  );
}
