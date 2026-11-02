"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Info, KeyRound, Lock, ShieldCheck, Sparkles, Users } from "lucide-react";
import { SegmentedControl } from "@/design-system/components/segmented-control";
import { InfoBadge } from "@/design-system/components/info-badge";
import { XocoAgent } from "./xoco-agent";
import { ProviderIcon } from "./provider-icon";
import { CopyButton } from "./copy-button";
import {
  CONNECT_STEPS,
  MCP_URL,
  type AssistantKey,
} from "../lib/connector-content";

type Status = "checking" | "online" | "offline" | "unknown";

// ¿Responde el conector? Lee sus metadatos públicos (no requiere sesión).
function useConnectorStatus(url: string): Status {
  const [status, setStatus] = useState<Status>("checking");
  useEffect(() => {
    const controller = new AbortController();
    const metadata = url.replace(/\/mcp$/, "/.well-known/oauth-protected-resource/mcp");
    fetch(metadata, { signal: controller.signal })
      .then((response) => setStatus(response.ok ? "online" : "offline"))
      .catch(() => {
        // Error de red o del navegador (ej. CORS): no sabemos si está caído.
        if (!controller.signal.aborted) setStatus("unknown");
      });
    return () => controller.abort();
  }, [url]);
  return status;
}

const STATUS_BADGE: Record<Status, { tone: "success" | "danger" | "neutral" | "warning"; label: string }> = {
  checking: { tone: "neutral", label: "Verificando..." },
  online: { tone: "success", label: "En línea" },
  offline: { tone: "danger", label: "Sin respuesta" },
  unknown: { tone: "warning", label: "No se pudo verificar" },
};

// IA Xoco → Conector MCP (solo Super admin): cómo conectar Claude o
// ChatGPT a los datos de Xoco, quién puede y qué pueden consultar.
export function McpConnectorView() {
  const url = MCP_URL;
  const status = useConnectorStatus(url);
  const [assistant, setAssistant] = useState<AssistantKey>("claude");
  const reduce = useReducedMotion();
  const guide = CONNECT_STEPS[assistant];

  return (
    <div className="flex flex-col gap-5">
      {/* Portada */}
      <section className="relative overflow-hidden rounded-2xl border border-[#5a3421]/30 bg-gradient-to-br from-[#2a170e] via-[#3b2216] to-[#5a3421] p-5 text-[#fff8f0] shadow-sm sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#e6c77c]/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-[#b27a52]/20 blur-3xl" />
        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <XocoAgent size={150} className="max-sm:scale-90" />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6c77c]/15 px-2.5 py-1 text-xs font-semibold tracking-wide text-[#e6c77c]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                XOCO IA
              </span>
              <InfoBadge tone={STATUS_BADGE[status].tone} dot size="sm">
                {STATUS_BADGE[status].label}
              </InfoBadge>
            </div>
            <h1 className="text-xl font-bold leading-tight sm:text-3xl">
              Pregúntale a Xoco desde{" "}
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <ProviderIcon provider="claude" className="size-[0.85em] text-[#e8a38a]" />
                Claude
              </span>{" "}
              o{" "}
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <ProviderIcon provider="openai" className="size-[0.85em]" />
                ChatGPT
              </span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[#f1dcc7]/85">
              El conector MCP le da a tu asistente de IA acceso de <strong className="text-[#fff8f0]">solo lectura</strong> a las ventas,
              metas e inventario de Xocolatísimo, y a Odoo. Pregunta en tus palabras y responde con las mismas cifras del panel.
            </p>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-left font-mono text-xs text-[#fff8f0] sm:text-sm">
                {url}
              </code>
              <CopyButton value={url} label="Copiar URL" variant="secondary" className="shrink-0" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        {/* Pasos */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Cómo conectarlo</h2>
              <p className="text-sm text-muted-foreground">{guide.where}</p>
            </div>
            <SegmentedControl
              ariaLabel="Asistente"
              value={assistant}
              onChange={setAssistant}
              options={[
                { value: "claude", label: "Claude", icon: <ProviderIcon provider="claude" className="size-3.5" /> },
                { value: "chatgpt", label: "ChatGPT", icon: <ProviderIcon provider="openai" className="size-3.5" /> },
              ]}
            />
          </div>

          <ol className="flex flex-col gap-3">
            {guide.steps.map((step, index) => (
              <motion.li
                key={`${assistant}-${step.title}`}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="flex gap-3 rounded-xl border border-border/70 bg-muted/30 p-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5a3421] text-sm font-bold text-[#fff8f0]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              </motion.li>
            ))}
          </ol>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {guide.plan}
          </p>
        </section>

        {/* Acceso */}
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground">Quién y cómo</h2>
          {[
            { icon: Users, title: "Super admin y Finanzas", text: "Cada persona lo conecta en su propia cuenta de Claude o ChatGPT." },
            { icon: KeyRound, title: "Con su usuario del panel", text: "Entra con su correo y contraseña; si lo desactivas aquí, pierde el acceso al instante." },
            { icon: Lock, title: "Solo lectura", text: "No puede crear, cambiar ni borrar nada en el panel ni en Odoo." },
            { icon: ShieldCheck, title: "Cifra oficial", text: "Para ventas usa la Venta Mensual del panel, la misma que ve Finanzas." },
          ].map((item) => (
            <div key={item.title} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#b27a52]/15 text-[#7b4a30] dark:text-[#d0996c]">
                <item.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

    </div>
  );
}
