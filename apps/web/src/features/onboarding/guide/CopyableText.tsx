import { Button } from "@gadz-connect/ui";
import { useState } from "react";

interface CopyableTextProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyableText({ text, label, className = "" }: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <code className="text-sm font-medium text-slate-800 break-words">
        {label ?? text}
      </code>
      <Button type="button" size="sm" variant="outline" onClick={() => void handleCopy()}>
        {copied ? "Copié ✓" : "Copier"}
      </Button>
    </div>
  );
}

interface CopyablePathProps {
  labels: readonly string[];
  fullText: string;
}

export function CopyablePath({ labels, fullText }: CopyablePathProps) {
  return (
    <div className="space-y-3">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {labels.map((label, i) => (
          <li key={label} className="flex items-center gap-1">
            <span className="rounded-md bg-indigo-100 px-2 py-1 font-medium text-indigo-900">
              {label}
            </span>
            {i < labels.length - 1 ? (
              <span className="text-slate-400" aria-hidden>
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <CopyableText text={fullText} />
    </div>
  );
}
