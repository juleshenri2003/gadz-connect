import { useState, type ReactNode } from "react";

export interface GuideAccordionItem {
  id: string;
  title: string;
  summary?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

interface GuideAccordionProps {
  items: GuideAccordionItem[];
  openId?: string;
  onOpenIdChange?: (id: string) => void;
  anchorPrefix?: string;
}

export function GuideAccordion({
  items,
  openId: controlledOpenId,
  onOpenIdChange,
  anchorPrefix = "guide-step",
}: GuideAccordionProps) {
  const defaultOpen = items.find((i) => i.defaultOpen)?.id ?? items[0]?.id ?? "";
  const [internalOpenId, setInternalOpenId] = useState(defaultOpen);
  const isControlled = controlledOpenId !== undefined;
  const openId = isControlled ? controlledOpenId : internalOpenId;

  function setOpenId(id: string) {
    if (isControlled) {
      onOpenIdChange?.(id);
    } else {
      setInternalOpenId(id);
    }
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            id={`${anchorPrefix}-${item.id}`}
            className={`scroll-mt-24 overflow-hidden rounded-md border bg-surface shadow-surface transition-shadow ${
              isOpen
                ? "border-brand-100 ring-1 ring-brand-100"
                : "border-line hover:shadow-raised"
            }`}
          >
            <button
              type="button"
              className="flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-paper"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? "" : item.id)}
            >
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white"
                aria-hidden
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink-900">{item.title}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-warning-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                      {item.badge}
                    </span>
                  ) : null}
                </span>
                {item.summary ? (
                  <span className="mt-1 block text-sm text-ink-600">{item.summary}</span>
                ) : null}
              </span>
              <span
                className={`mt-1 shrink-0 text-ink-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden
              >
                ▾
              </span>
            </button>
            {isOpen ? (
              <div className="border-t border-line bg-paper/40 px-4 py-4 pl-14 text-sm leading-relaxed text-ink-600">
                {item.children}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
