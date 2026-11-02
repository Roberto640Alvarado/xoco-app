"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check } from "lucide-react";
import type { ChatEntry } from "../types/ai-chat.types";
import { XocoAgent } from "./xoco-agent";
import { CopyButton } from "./copy-button";
import { ThinkingIndicator } from "./thinking-indicator";
import { blocksToPlainText } from "../lib/copy-text";
import { TypingText } from "./typing-text";
import { SpeakButton } from "./speak-button";
import { ChatChart } from "./chat-chart";
import { ChatTable } from "./chat-table";

type AssistantEntry = Extract<ChatEntry, { role: "assistant" }>;

export function UserBubble({ text }: { text: string }) {
  return (
    <div className="group/user ml-auto flex max-w-[85%] flex-col items-end gap-1">
      <div className="whitespace-pre-wrap rounded-3xl bg-muted px-4 py-2.5 text-sm text-foreground">{text}</div>
      <CopyButton
        value={text}
        size="icon"
        variant="ghost"
        label="Copiar pregunta"
        className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover/user:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
      />
    </div>
  );
}

/** Respuesta de Xoco IA: pasos de consulta, texto, gráficas y tablas en orden. */
export function AssistantMessage({ entry }: { entry: AssistantEntry }) {
  const reduce = useReducedMotion();
  const streaming = entry.status === "streaming";
  const last = entry.blocks.at(-1);
  const lastTextIndex = entry.blocks.findLastIndex((block) => block.kind === "text");
  // Mientras escribe el último texto, el punto va al final del texto (como ChatGPT);
  // si después de ese texto sigue consultando, se muestra "Pensando…".
  const thinking = streaming && last?.kind !== "text";
  const mood = streaming ? (thinking ? "thinking" : "talking") : "idle";
  const plain = blocksToPlainText(entry.blocks);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group/answer flex w-full gap-2.5 sm:gap-3"
    >
      <XocoAgent size={32} sparkles={false} mood={mood} className="mt-0.5" />
      <div className="flex min-w-0 flex-1 flex-col gap-3 pt-1 text-sm leading-relaxed text-foreground">
        {entry.blocks.map((block, index) => {
          if (block.kind === "tool") {
            const done = index < entry.blocks.length - 1 || !streaming;
            if (!done) return null;
            return (
              <span key={index} className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                Consultó {block.title}
              </span>
            );
          }
          if (block.kind === "text") {
            return <TypingText key={index} text={block.text} animate={Boolean(block.fresh)} cursor={streaming && index === lastTextIndex && index === entry.blocks.length - 1} />;
          }
          if (block.kind === "chart") return <ChatChart key={index} chart={block.chart} />;
          if (block.kind === "table") return <ChatTable key={index} table={block.table} />;
          return (
            <p key={index} role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {block.message}
            </p>
          );
        })}

        {thinking && <ThinkingIndicator activity={last?.kind === "tool" ? last.title : undefined} />}
        {entry.status === "stopped" && <p className="text-xs text-muted-foreground">Respuesta detenida.</p>}

        {!streaming && plain && (
          <div className="-ml-1.5 flex items-center gap-0.5">
            <CopyButton value={plain} size="icon" variant="ghost" label="Copiar respuesta" className="h-7 w-7 text-muted-foreground" />
            <SpeakButton id={entry.id} text={entry.blocks.filter((block) => block.kind === "text").map((block) => (block.kind === "text" ? block.text : "")).join("\n\n")} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
