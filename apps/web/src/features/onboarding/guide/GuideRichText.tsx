import { cn } from "@gadz-connect/ui";
import type { ReactNode } from "react";

const BOLD_RE = /\*\*(.+?)\*\*/g;

export function renderGuideText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(BOLD_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }
    nodes.push(
      <strong key={`b-${index}`} className="font-semibold text-ink-900">
        {match[1]}
      </strong>,
    );
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

interface GuideRichTextProps {
  text: string;
  className?: string;
  as?: "p" | "span" | "li";
}

export function GuideRichText({
  text,
  className,
  as: Tag = "span",
}: GuideRichTextProps) {
  return <Tag className={cn(className)}>{renderGuideText(text)}</Tag>;
}

interface GuideRichListProps {
  items: readonly string[];
  ordered?: boolean;
  className?: string;
}

export function GuideRichList({
  items,
  ordered = false,
  className,
}: GuideRichListProps) {
  const ListTag = ordered ? "ol" : "ul";
  return (
    <ListTag
      className={cn(
        ordered ? "list-decimal space-y-2 pl-5" : "list-disc space-y-2 pl-5",
        className,
      )}
    >
      {items.map((item) => (
        <GuideRichText key={item} as="li" text={item} className="text-ink-600" />
      ))}
    </ListTag>
  );
}
