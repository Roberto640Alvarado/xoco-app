"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { RichText } from "./rich-text";

/**
 * Escribe el texto poco a poco, como ChatGPT, con el punto al final mientras
 * escribe. La IA manda el texto completo: aquí solo se revela (≈1-2 s).
 */
export function TypingText({ text, animate, cursor }: { text: string; animate: boolean; cursor: boolean }) {
  const reduce = useReducedMotion();
  const skip = !animate || Boolean(reduce);
  const [shown, setShown] = useState(skip ? text.length : 0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (skip) return;
    const step = Math.max(2, Math.ceil(text.length / 90));
    const tick = () => {
      setShown((current) => {
        const next = Math.min(text.length, current + step);
        if (next < text.length) frame.current = requestAnimationFrame(tick);
        return next;
      });
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [skip, text]);

  const visible = skip ? text : text.slice(0, shown);
  const typing = !skip && shown < text.length;

  return (
    <div className="relative">
      <RichText text={visible} />
      {(typing || cursor) && (
        <span aria-hidden="true" className="ml-1 inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-foreground align-middle motion-reduce:animate-none" />
      )}
    </div>
  );
}
