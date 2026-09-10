import { Fragment } from "react";

/** Renders **bold** markers (the AI is instructed to use them for key
 * terms) as a real paper highlighter effect — used only inside the
 * notebook-paper fiche content, so a translucent yellow background reads
 * as a highlighter stroke rather than plain bold. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <mark key={i} className="rounded-[2px] bg-yellow-300/50 px-0.5 font-semibold text-inherit">
              {part.slice(2, -2)}
            </mark>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
