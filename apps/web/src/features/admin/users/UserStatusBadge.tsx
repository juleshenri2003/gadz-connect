import { Badge } from "@gadz-connect/ui";
import type { AccountStatus } from "@gadz-connect/types";
import { STATUS_LABELS } from "./adminUserLabels";

const STATUS_VARIANT: Record<
  AccountStatus,
  "warning" | "success" | "neutral"
> = {
  pending_siret: "warning",
  active: "success",
  suspended: "neutral",
};

export function UserStatusBadge({ status }: { status: AccountStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
  );
}
