"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, ExternalLink, FlaskConical, KeyRound, Loader2, Plus, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import { ProviderIcon } from "./provider-icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InfoBadge, type InfoBadgeTone } from "@/design-system/components/info-badge";
import { SectionCard } from "@/design-system/components/section-card";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/api/client";
import { useAiKeys, useRemoveAiKey, useSaveAiKey, useTestAiKey } from "../hooks/use-ai-admin";
import type { AiKeyInfo, AiKeyStatus } from "../types/ai-admin.types";
import type { AiProviderKey } from "../types/ai-chat.types";

const PROVIDER_META: Record<AiProviderKey, { tint: string; console: string; consoleLabel: string; hint: string }> = {
  claude: {
    tint: "bg-[#d97757]/15 text-[#c15f3c] dark:text-[#e8a38a]",
    console: "https://console.anthropic.com/settings/keys",
    consoleLabel: "console.anthropic.com",
    hint: "Empieza con sk-ant-",
  },
  openai: {
    tint: "bg-foreground/[0.06] text-foreground",
    console: "https://platform.openai.com/api-keys",
    consoleLabel: "platform.openai.com",
    hint: "Empieza con sk-",
  },
};

function statusBadge(key: AiKeyInfo): { tone: InfoBadgeTone; label: string } {
  if (!key.source) return { tone: "neutral", label: "Sin llave" };
  const byStatus: Record<AiKeyStatus, { tone: InfoBadgeTone; label: string }> = {
    OK: { tone: "success", label: "Conectada" },
    SIN_CREDITO: { tone: "warning", label: "Sin crédito" },
    INVALIDA: { tone: "danger", label: "Inválida" },
    ERROR: { tone: "danger", label: "Con problema" },
  };
  if (key.status) return byStatus[key.status];
  return { tone: "info", label: "Desde el servidor" };
}

const CHECK_TONE: Record<AiKeyStatus, string> = {
  OK: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  SIN_CREDITO: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  INVALIDA: "border-destructive/30 bg-destructive/10 text-destructive",
  ERROR: "border-destructive/30 bg-destructive/10 text-destructive",
};

function CheckNotice({ status, message }: { status: AiKeyStatus; message: string }) {
  const Icon = status === "OK" ? CheckCircle2 : TriangleAlert;
  return (
    <p role="status" className={cn("flex items-start gap-2 rounded-xl border px-3 py-2 text-sm", CHECK_TONE[status])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

function SaveKeyDialog({ target, onClose }: { target: AiKeyInfo | null; onClose: () => void }) {
  const save = useSaveAiKey();
  const [value, setValue] = useState("");
  const [lastTarget, setLastTarget] = useState<AiKeyInfo | null>(null);

  if (target !== lastTarget) {
    setLastTarget(target);
    setValue("");
    save.reset();
  }

  const meta = target ? PROVIDER_META[target.provider] : null;
  const errorMessage = (save.error as ApiError | null)?.message;
  const result = save.data?.check;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!target || value.trim().length < 20) return;
    save.mutate(
      { provider: target.provider, apiKey: value.trim() },
      { onSuccess: () => setTimeout(onClose, 1800) },
    );
  }

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && !save.isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            {target && <ProviderIcon provider={target.provider} className="size-5" />}
            {target?.source === "panel" ? "Cambiar" : "Agregar"} llave de {target?.label}
          </DialogTitle>
          <DialogDescription className="pt-1 leading-relaxed">
            Antes de guardarla hacemos una petición de prueba a {target?.model} para confirmar que la llave es correcta y que la
            cuenta tiene crédito (cuesta menos de un centavo). Se guarda cifrada y solo se muestran sus últimos 4 caracteres.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <CheckNotice status={result.status} message={result.message} />
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ai-key-input">Llave de API</Label>
              <PasswordInput
                id="ai-key-input"
                autoComplete="off"
                spellCheck={false}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={meta?.hint}
                disabled={save.isPending}
              />
              {meta && (
                <a href={meta.console} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                  Sácala en {meta.consoleLabel}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
            </div>

            {save.isPending && (
              <p className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Probando la llave con {target?.model}…
              </p>
            )}
            {errorMessage && !save.isPending && (
              <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending || value.trim().length < 20}>
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FlaskConical className="h-4 w-4" aria-hidden="true" />}
                Probar y guardar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function KeyCard({ item, index, onEdit, onRemove }: { item: AiKeyInfo; index: number; onEdit: () => void; onRemove: () => void }) {
  const reduce = useReducedMotion();
  const test = useTestAiKey();
  const meta = PROVIDER_META[item.provider];
  const badge = statusBadge(item);
  const testError = (test.error as ApiError | null)?.message;

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", meta.tint)}>
            <ProviderIcon provider={item.provider} className="size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">{item.label}</h2>
            <p className="truncate text-xs text-muted-foreground">Modelo fijo: {item.model}</p>
          </div>
        </div>
        <InfoBadge tone={badge.tone} dot>
          {badge.label}
        </InfoBadge>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2.5">
        <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <code className="truncate font-mono text-sm text-foreground">{item.last4 ? `•••• •••• •••• ${item.last4}` : "Sin llave"}</code>
        {item.source && (
          <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{item.source === "panel" ? "Guardada en el panel" : "Variable del servidor"}</span>
        )}
      </div>

      {test.data ? (
        <CheckNotice status={test.data.check.status} message={test.data.check.message} />
      ) : (
        item.statusMessage && item.status && <CheckNotice status={item.status} message={item.statusMessage} />
      )}
      {testError && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {testError}
        </p>
      )}

      {item.checkedAt && (
        <p className="text-xs text-muted-foreground">
          Última prueba: {formatDateTime(item.checkedAt)}
          {item.updatedByEmail ? ` · guardada por ${item.updatedByEmail}` : ""}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        <Button type="button" onClick={onEdit}>
          {item.source === "panel" ? <RefreshCw className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          {item.source === "panel" ? "Cambiar llave" : "Agregar llave"}
        </Button>
        {item.source && (
          <Button type="button" variant="outline" onClick={() => test.mutate(item.provider)} disabled={test.isPending}>
            {test.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FlaskConical className="h-4 w-4" aria-hidden="true" />}
            {test.isPending ? "Probando…" : "Probar ahora"}
          </Button>
        )}
        {item.source === "panel" && (
          <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={onRemove}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Quitar
          </Button>
        )}
      </div>
    </motion.article>
  );
}

// Xoco IA → Llaves de API (solo Super admin): Claude y OpenAI. Cada llave se
// prueba al guardarla (válida, con crédito y con acceso al modelo).
export function AiKeysView() {
  const { data: keys, isLoading, isError, error } = useAiKeys();
  const remove = useRemoveAiKey();
  const [editing, setEditing] = useState<AiKeyInfo | null>(null);
  const [removing, setRemoving] = useState<AiKeyInfo | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        icon={KeyRound}
        title="Llaves de API"
        description="Las llaves con las que Xoco IA usa Claude y ChatGPT. Solo el Super admin las ve; nunca llegan al navegador de los demás."
      />

      {isError ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(error as unknown as ApiError)?.message ?? "No se pudieron cargar las llaves."}
        </p>
      ) : isLoading || !keys ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index} className="h-64 animate-pulse rounded-2xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {keys.map((item, index) => (
            <KeyCard key={item.provider} item={item} index={index} onEdit={() => setEditing(item)} onRemove={() => setRemoving(item)} />
          ))}
        </div>
      )}


      <SaveKeyDialog target={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Quitar la llave de ${removing?.label ?? ""}`}
        description="Xoco IA dejará de usar esta llave. Si el servidor tiene una de respaldo, se usará esa; si no, esta IA quedará deshabilitada en el chat."
        confirmLabel="Quitar llave"
        variant="destructive"
        isLoading={remove.isPending}
        errorMessage={(remove.error as ApiError | null)?.message ?? null}
        onConfirm={() => removing && remove.mutate(removing.provider, { onSuccess: () => setRemoving(null) })}
      />
    </div>
  );
}
