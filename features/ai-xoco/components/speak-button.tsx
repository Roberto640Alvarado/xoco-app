"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Square, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Lectura en voz alta con la voz del navegador (Web Speech API): gratis, sin
// mandar nada a otro servidor. Una sola respuesta suena a la vez.
let speakingId: string | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  speakingId = null;
  notify();
}

/** Texto para leer: sin marcas de formato ni tablas, con "dólares" donde hay $. */
function speakable(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^#+\s+/gm, "")
    .replace(/\$\s?([\d,]+(?:\.\d+)?)/g, "$1 dólares")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, ", ")
    .trim();
}

/** Trozos de ~220 caracteres por oraciones: algunos navegadores cortan los textos largos. */
function chunks(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const parts: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > 220 && current) {
      parts.push(current.trim());
      current = "";
    }
    current += sentence;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function spanishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang === "es-MX") ??
    voices.find((voice) => voice.lang === "es-US") ??
    voices.find((voice) => voice.lang.startsWith("es-4")) ??
    voices.find((voice) => voice.lang.startsWith("es"))
  );
}

export function SpeakButton({ id, text, className }: { id: string; text: string; className?: string }) {
  const [supported, setSupported] = useState(false);
  const active = useSyncExternalStore(subscribe, () => speakingId === id, () => false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported("speechSynthesis" in window);
    // Las voces cargan después en algunos navegadores.
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
  }, []);

  useEffect(() => () => {
    if (speakingId === id) stopSpeaking();
  }, [id]);

  if (!supported) return null;

  function toggle() {
    if (active) {
      stopSpeaking();
      return;
    }
    stopSpeaking();
    const parts = chunks(speakable(text));
    if (parts.length === 0) return;
    speakingId = id;
    notify();
    const voice = spanishVoice();
    parts.forEach((part, index) => {
      const utterance = new SpeechSynthesisUtterance(part);
      utterance.lang = voice?.lang ?? "es-MX";
      if (voice) utterance.voice = voice;
      utterance.rate = 1.02;
      if (index === parts.length - 1) {
        utterance.onend = () => {
          if (speakingId === id) {
            speakingId = null;
            notify();
          }
        };
      }
      utterance.onerror = () => {
        if (speakingId === id) {
          speakingId = null;
          notify();
        }
      };
      window.speechSynthesis.speak(utterance);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={active ? "Detener lectura" : "Escuchar respuesta"}
      title={active ? "Detener lectura" : "Escuchar respuesta"}
      aria-pressed={active}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10",
        active && "text-foreground",
        className,
      )}
    >
      {active ? <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
