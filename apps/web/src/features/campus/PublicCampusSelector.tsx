import {
  cn,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gadz-connect/ui";
import { useMemo } from "react";
import {
  campusDisplayName,
  sortCampuses,
} from "@/features/campus/campusLabels";
import { usePublicCampusRoute } from "@/features/campus/usePublicCampusRoute";

interface PublicCampusSelectorProps {
  className?: string;
  id?: string;
}

export function PublicCampusSelector({
  className,
  id = "public-campus",
}: PublicCampusSelectorProps) {
  const { campusId, campuses, selectCampus, selectedCampus } =
    usePublicCampusRoute();

  const sortedCampuses = useMemo(() => sortCampuses(campuses), [campuses]);

  const selectValue = useMemo(() => {
    if (!sortedCampuses.length) return null;
    if (campusId && sortedCampuses.some((c) => c.id === campusId)) {
      return campusId;
    }
    return sortedCampuses[0]!.id;
  }, [campusId, sortedCampuses]);

  const campusLabel = selectedCampus
    ? campusDisplayName(selectedCampus.name)
    : null;

  if (!selectValue) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="shrink-0 text-xs font-medium text-ink-500">
          Campus
        </span>
        <span
          id={id}
          className="flex h-9 min-w-[9.5rem] items-center rounded-md border border-line bg-surface px-3 text-sm text-ink-400"
        >
          Chargement…
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label
        htmlFor={id}
        className="shrink-0 text-xs font-medium text-ink-500"
      >
        Campus
      </label>
      <Select value={selectValue} onValueChange={selectCampus}>
        <SelectTrigger
          id={id}
          aria-label={
            campusLabel ? `Campus : ${campusLabel}` : "Choisir un campus"
          }
          className="h-9 w-auto min-w-[9.5rem] max-w-[13rem] shrink-0 px-3"
        >
          <SelectValue className="truncate text-sm font-medium text-ink-900" />
        </SelectTrigger>
        <SelectContent align="end" className="min-w-[16rem]">
          {sortedCampuses.map((campus) => (
            <SelectItem key={campus.id} value={campus.id}>
              {campusDisplayName(campus.name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
