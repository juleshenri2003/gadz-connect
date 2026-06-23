import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gadz-connect/ui";
import { Outlet } from "react-router-dom";
import {
  campusDisplayName,
  sortCampuses,
} from "@/features/campus/campusLabels";
import { useSelectedCampus } from "@/features/campus/useSelectedCampus";
import { PublicFooter, PublicHeader } from "./PublicHeader";

function CampusSelector() {
  const { campusId, setCampusId, campuses, isLoading } = useSelectedCampus();

  return (
    <div className="space-y-1">
      <Label htmlFor="public-campus" className="sr-only">
        Campus
      </Label>
      <Select
        value={campusId ?? ""}
        onValueChange={setCampusId}
        disabled={isLoading || !campuses.length}
      >
        <SelectTrigger id="public-campus" className="h-9 w-full">
          <SelectValue
            placeholder={isLoading ? "Chargement…" : "Campus"}
          />
        </SelectTrigger>
        <SelectContent>
          {sortCampuses(campuses).map((campus) => (
            <SelectItem key={campus.id} value={campus.id}>
              {campusDisplayName(campus.name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <PublicHeader campusSelector={<CampusSelector />} />
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
