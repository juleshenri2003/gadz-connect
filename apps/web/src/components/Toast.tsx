import { cn } from "@gadz-connect/ui";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Toast({
  message,
  variant = "success",
  onDismiss,
}: {
  message: string;
  variant?: "success" | "error";
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 3500);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return createPortal(
    <div
      className={cn(
        "fixed z-[60] max-w-sm rounded-md border px-4 py-3 text-sm shadow-raised",
        "max-md:bottom-safe-toast max-md:inset-x-4 max-md:max-w-none",
        "md:bottom-6 md:right-6",
        variant === "success"
          ? "border-success/20 bg-success-bg text-success"
          : "border-danger/20 bg-danger-bg text-danger",
      )}
      role="status"
    >
      {message}
    </div>,
    document.body,
  );
}
