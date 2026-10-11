"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { INFO, type InfoTopic } from "../content";

export type { InfoTopic };

interface InfoHintProps {
  topic: InfoTopic;
}

// Botón ⓘ chico que abre un modal con la explicación de un concepto (qué es
// la existencia estimada, qué significa cada estado, etc.) — para que quien
// use Inventario entienda el flujo sin salir de la pantalla. El texto vive
// en content.ts.
export function InfoHint({ topic }: InfoHintProps) {
  const [open, setOpen] = useState(false);
  const info = INFO[topic];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        aria-label={`Más información: ${info.title}`}
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">{info.title}</DialogTitle>
            <DialogDescription className="pt-1 leading-relaxed">{info.paragraphs.join(" ")}</DialogDescription>
          </DialogHeader>
          {info.bullets && (
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-foreground">
              {info.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
