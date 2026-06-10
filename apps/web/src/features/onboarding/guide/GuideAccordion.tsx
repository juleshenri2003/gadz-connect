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
}

export function GuideAccordion({ items }: GuideAccordionProps) {
  const defaultOpen = items.find((i) => i.defaultOpen)?.id ?? items[0]?.id ?? "";
  const [openId, setOpenId] = useState(defaultOpen);

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <button
              type="button"
              className="flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-slate-50"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? "" : item.id)}
            >
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white"
                aria-hidden
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">{item.title}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                      {item.badge}
                    </span>
                  ) : null}
                </span>
                {item.summary ? (
                  <span className="mt-1 block text-sm text-slate-600">{item.summary}</span>
                ) : null}
              </span>
              <span
                className={`mt-1 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden
              >
                ▾
              </span>
            </button>
            {isOpen ? (
              <div className="border-t border-slate-100 px-4 py-4 pl-14 text-sm text-slate-700">
                {item.children}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
