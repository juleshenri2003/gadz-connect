import type {
  TransactionStripeStatus,
  TransactionUrssafStatus,
} from "@gadz-connect/types";
import { cn } from "@gadz-connect/ui";
import {
  STRIPE_STATUS_LABELS,
  stripeBadgeClass,
  URSSAF_STATUS_LABELS,
  urssafBadgeClass,
} from "./adminBudgetLabels";

export function StripeStatusBadge({
  status,
  className,
}: {
  status: TransactionStripeStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
        stripeBadgeClass(status),
        className,
      )}
    >
      {STRIPE_STATUS_LABELS[status]}
    </span>
  );
}

export function UrssafStatusBadge({
  status,
  className,
}: {
  status: TransactionUrssafStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
        urssafBadgeClass(status),
        className,
      )}
    >
      {URSSAF_STATUS_LABELS[status]}
    </span>
  );
}
