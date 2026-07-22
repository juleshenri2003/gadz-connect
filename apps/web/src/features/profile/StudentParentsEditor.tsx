import { Button, Input, Label } from "@gadz-connect/ui";
import { useEffect, useState } from "react";
import {
  type StudentParent,
  useUpdateStudentParents,
} from "@/features/auth/useMyProfile";

const MAX_PARENTS = 4;

function emptyDraft(): Omit<StudentParent, "id"> {
  return { first_name: "", last_name: "", email: "" };
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

interface StudentParentsEditorProps {
  parents: StudentParent[];
}

export function StudentParentsEditor({ parents }: StudentParentsEditorProps) {
  const updateParents = useUpdateStudentParents();
  const [list, setList] = useState<StudentParent[]>(parents);
  const [draft, setDraft] = useState(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setList(parents);
  }, [parents]);

  useEffect(() => {
    if (!updateParents.isSuccess) return;
    setSuccess(true);
    const timer = window.setTimeout(() => setSuccess(false), 4000);
    return () => window.clearTimeout(timer);
  }, [updateParents.isSuccess]);

  async function persist(next: StudentParent[]) {
    setError(null);
    try {
      const result = await updateParents.mutateAsync(next);
      setList(result.parents);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Enregistrement impossible",
      );
    }
  }

  async function handleAdd() {
    const first = draft.first_name.trim();
    const last = draft.last_name.trim();
    const email = draft.email.trim();
    if (!first || !last) {
      setError("Prénom et nom sont obligatoires.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("E-mail parent invalide.");
      return;
    }
    if (list.length >= MAX_PARENTS) {
      setError(`Maximum ${MAX_PARENTS} parents.`);
      return;
    }
    const next: StudentParent[] = [
      ...list,
      {
        id: crypto.randomUUID(),
        first_name: first,
        last_name: last,
        email,
      },
    ];
    await persist(next);
    setDraft(emptyDraft());
  }

  async function handleSaveEdit(parent: StudentParent) {
    const first = parent.first_name.trim();
    const last = parent.last_name.trim();
    const email = parent.email.trim();
    if (!first || !last) {
      setError("Prénom et nom sont obligatoires.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("E-mail parent invalide.");
      return;
    }
    const next = list.map((p) =>
      p.id === parent.id
        ? { ...parent, first_name: first, last_name: last, email }
        : p,
    );
    await persist(next);
    setEditingId(null);
  }

  async function handleRemove(id: string) {
    await persist(list.filter((p) => p.id !== id));
    if (editingId === id) setEditingId(null);
  }

  return (
    <section className="border-t border-line pt-6">
      <h3 className="text-sm font-semibold text-ink-900">Parents / payeurs</h3>
      <p className="mt-1 text-sm text-ink-400">
        Utilisés pour facturer les cours à votre place. Le bénéficiaire du cours
        reste toujours vous.
      </p>

      {list.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">Aucun parent déclaré.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {list.map((parent) => {
            const editing = editingId === parent.id;
            return (
              <li
                key={parent.id}
                className="rounded-md border border-line bg-paper/40 p-3"
              >
                {editing ? (
                  <div className="space-y-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor={`parent-first-${parent.id}`}>
                          Prénom
                        </Label>
                        <Input
                          id={`parent-first-${parent.id}`}
                          value={parent.first_name}
                          onChange={(event) =>
                            setList((prev) =>
                              prev.map((p) =>
                                p.id === parent.id
                                  ? { ...p, first_name: event.target.value }
                                  : p,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`parent-last-${parent.id}`}>Nom</Label>
                        <Input
                          id={`parent-last-${parent.id}`}
                          value={parent.last_name}
                          onChange={(event) =>
                            setList((prev) =>
                              prev.map((p) =>
                                p.id === parent.id
                                  ? { ...p, last_name: event.target.value }
                                  : p,
                              ),
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`parent-email-${parent.id}`}>E-mail</Label>
                      <Input
                        id={`parent-email-${parent.id}`}
                        type="email"
                        value={parent.email}
                        onChange={(event) =>
                          setList((prev) =>
                            prev.map((p) =>
                              p.id === parent.id
                                ? { ...p, email: event.target.value }
                                : p,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={updateParents.isPending}
                        onClick={() => void handleSaveEdit(parent)}
                      >
                        Enregistrer
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setList(parents);
                          setEditingId(null);
                          setError(null);
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-ink-900">
                        {parent.first_name} {parent.last_name}
                      </p>
                      <p className="text-xs text-ink-500">{parent.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(parent.id)}
                      >
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={updateParents.isPending}
                        onClick={() => void handleRemove(parent.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {list.length < MAX_PARENTS ? (
        <div className="mt-4 space-y-2 rounded-md border border-dashed border-line p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Ajouter un parent
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="new-parent-first">Prénom</Label>
              <Input
                id="new-parent-first"
                value={draft.first_name}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    first_name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-parent-last">Nom</Label>
              <Input
                id="new-parent-last"
                value={draft.last_name}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    last_name: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-parent-email">E-mail</Label>
            <Input
              id="new-parent-email"
              type="email"
              value={draft.email}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, email: event.target.value }))
              }
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={updateParents.isPending}
            onClick={() => void handleAdd()}
          >
            Ajouter
          </Button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {success ? (
        <p className="mt-3 text-sm text-success">Parents enregistrés.</p>
      ) : null}
    </section>
  );
}
