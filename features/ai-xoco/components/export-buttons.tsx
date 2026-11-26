"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExportButtonsProps {
  onExcel: () => void;
  onPdf: () => Promise<void>;
  /** Texto accesible: "tabla", "gráfica" o "respuesta". */
  subject: string;
  /** icon: solo iconos (pie de la respuesta); sm: con texto (encabezado de tabla/gráfica). */
  size?: "sm" | "icon";
  className?: string;
}

// Botones "Excel" y "PDF" de Xoco IA: el archivo se arma en el navegador con
// los mismos datos que se ven en el chat.
export function ExportButtons({ onExcel, onPdf, subject, size = "sm", className }: ExportButtonsProps) {
  const [pdfLoading, setPdfLoading] = useState(false);

  async function handlePdf() {
    setPdfLoading(true);
    try {
      await onPdf();
    } finally {
      setPdfLoading(false);
    }
  }

  const buttonClass = size === "icon" ? "h-7 w-7 text-muted-foreground" : "h-7 px-2 text-xs font-normal text-muted-foreground";

  return (
    <div className={cn("flex shrink-0 items-center gap-0.5", className)}>
      <Button type="button" variant="ghost" size={size} onClick={onExcel} className={buttonClass} aria-label={`Descargar ${subject} en Excel`} title={`Descargar ${subject} en Excel`}>
        <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
        {size !== "icon" && "Excel"}
      </Button>
      <Button type="button" variant="ghost" size={size} onClick={handlePdf} disabled={pdfLoading} className={buttonClass} aria-label={`Descargar ${subject} en PDF`} title={`Descargar ${subject} en PDF`}>
        {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileText className="h-4 w-4" aria-hidden="true" />}
        {size !== "icon" && "PDF"}
      </Button>
    </div>
  );
}
