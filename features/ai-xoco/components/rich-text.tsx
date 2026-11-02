import { Fragment, type ReactNode } from "react";

// Markdown mínimo de las respuestas: párrafos, listas (- / 1.), **negritas**
// y `código`. Sin HTML crudo (nada se inyecta con dangerouslySetInnerHTML).
function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index} className="rounded bg-muted px-1 py-0.5 font-mono text-[12px]">{part.slice(1, -1)}</code>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className="flex flex-col gap-2.5">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter((line) => line.trim().length > 0);
        if (lines.length === 0) return null;
        const bullet = lines.every((line) => /^\s*[-*•]\s+/.test(line));
        const numbered = lines.every((line) => /^\s*\d+[.)]\s+/.test(line));
        if (bullet || numbered) {
          const List = numbered ? "ol" : "ul";
          return (
            <List key={blockIndex} className={numbered ? "ml-5 list-decimal space-y-1" : "ml-5 list-disc space-y-1"}>
              {lines.map((line, index) => (
                <li key={index}>{inline(line.replace(/^\s*([-*•]|\d+[.)])\s+/, ""))}</li>
              ))}
            </List>
          );
        }
        if (/^#{1,4}\s+/.test(lines[0])) {
          return (
            <div key={blockIndex}>
              <p className="font-semibold text-foreground">{inline(lines[0].replace(/^#{1,4}\s+/, ""))}</p>
              {lines.slice(1).map((line, index) => (
                <p key={index}>{inline(line)}</p>
              ))}
            </div>
          );
        }
        return (
          <p key={blockIndex}>
            {lines.map((line, index) => (
              <Fragment key={index}>
                {index > 0 && <br />}
                {inline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
