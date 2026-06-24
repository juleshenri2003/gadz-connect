import { Button, Input, Label } from "@gadz-connect/ui";
import {
  createEmptyProfileLink,
  PROFILE_LINK_KIND_OPTIONS,
  type TutorProfileLink,
} from "./profileLinks";

const MAX_LINKS = 8;

interface TeacherProfileLinksEditorProps {
  links: TutorProfileLink[];
  onChange: (links: TutorProfileLink[]) => void;
}

export function TeacherProfileLinksEditor({
  links,
  onChange,
}: TeacherProfileLinksEditorProps) {
  function updateLink(index: number, patch: Partial<TutorProfileLink>) {
    onChange(
      links.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  }

  function removeLink(index: number) {
    onChange(links.filter((_, i) => i !== index));
  }

  function addLink() {
    if (links.length >= MAX_LINKS) return;
    onChange([...links, createEmptyProfileLink()]);
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Liens publics</Label>
        <p className="mt-1 text-xs text-ink-400">
          LinkedIn, Google Scholar, site personnel ou autre — affichés sur votre
          fiche tuteur.
        </p>
      </div>

      {links.length === 0 ? (
        <p className="text-sm text-ink-400">Aucun lien ajouté.</p>
      ) : (
        <ul className="space-y-3">
          {links.map((link, index) => (
            <li
              key={index}
              className="rounded-lg border border-line bg-paper/60 p-3 space-y-2"
            >
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[10rem] flex-1 space-y-1">
                  <Label htmlFor={`profile-link-kind-${index}`} className="text-xs">
                    Type
                  </Label>
                  <select
                    id={`profile-link-kind-${index}`}
                    className="flex h-10 w-full rounded-md border border-line bg-surface px-3 text-sm"
                    value={link.kind}
                    onChange={(event) =>
                      updateLink(index, {
                        kind: event.target.value as TutorProfileLink["kind"],
                        ...(event.target.value !== "other" ? { label: undefined } : {}),
                      })
                    }
                  >
                    {PROFILE_LINK_KIND_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => removeLink(index)}
                >
                  Retirer
                </Button>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`profile-link-url-${index}`} className="text-xs">
                  URL
                </Label>
                <Input
                  id={`profile-link-url-${index}`}
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  value={link.url}
                  onChange={(event) => updateLink(index, { url: event.target.value })}
                />
              </div>

              {link.kind === "other" ? (
                <div className="space-y-1">
                  <Label htmlFor={`profile-link-label-${index}`} className="text-xs">
                    Libellé
                  </Label>
                  <Input
                    id={`profile-link-label-${index}`}
                    placeholder="Ex. Portfolio, GitHub…"
                    maxLength={40}
                    value={link.label ?? ""}
                    onChange={(event) =>
                      updateLink(index, { label: event.target.value })
                    }
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={links.length >= MAX_LINKS}
        onClick={addLink}
      >
        Ajouter un lien
      </Button>
    </div>
  );
}
