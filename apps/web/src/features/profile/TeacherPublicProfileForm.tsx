import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@gadz-connect/ui";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatEuro } from "@/features/admin/format";
import type { MyProfile } from "@/features/auth/useMyProfile";
import {
  BIO_MAX_LENGTH,
} from "@/features/marketplace/teacherCoursesTab";
import {
  useMyTutorProfile,
  useUpdateTutorProfile,
} from "@/features/marketplace/useTutors";
import { TeacherProfileLinksEditor } from "./TeacherProfileLinksEditor";
import {
  normalizeProfileLinksForSave,
  type TutorProfileLink,
} from "./profileLinks";

interface TeacherPublicProfileFormProps {
  profile: MyProfile;
  variant?: "standalone" | "courses-tab";
}

export function TeacherPublicProfileForm({
  profile,
  variant = "standalone",
}: TeacherPublicProfileFormProps) {
  const { data: tutorProfile, isLoading } = useMyTutorProfile();
  const updateProfile = useUpdateTutorProfile();

  const [bio, setBio] = useState("");
  const [rate, setRate] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [profileLinks, setProfileLinks] = useState<TutorProfileLink[]>([]);
  const [subjectDraft, setSubjectDraft] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const hourlyRate = tutorProfile?.hourly_rate ?? profile.hourly_rate;
  const marketplace = profile.marketplace ?? tutorProfile?.marketplace;

  useEffect(() => {
    if (!tutorProfile) return;
    setBio(tutorProfile.bio ?? profile.bio ?? "");
    setRate(
      hourlyRate != null && hourlyRate > 0 ? String(hourlyRate) : "",
    );
    setSubjects(tutorProfile.subjects ?? profile.subjects ?? []);
    setProfileLinks(
      (tutorProfile.profile_links as TutorProfileLink[] | undefined) ?? [],
    );
  }, [tutorProfile, profile.bio, profile.subjects, hourlyRate]);

  useEffect(() => {
    if (!updateProfile.isSuccess) return;
    setSaveSuccess(true);
    const timer = window.setTimeout(() => {
      setSaveSuccess(false);
      updateProfile.reset();
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [updateProfile.isSuccess, updateProfile]);

  function addSubject() {
    const trimmed = subjectDraft.trim();
    if (!trimmed || subjects.includes(trimmed)) return;
    setSubjects((prev) => [...prev, trimmed]);
    setSubjectDraft("");
  }

  function removeSubject(subject: string) {
    setSubjects((prev) => prev.filter((s) => s !== subject));
  }

  async function saveProfile() {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateProfile.mutateAsync({
        bio: bio.trim() || undefined,
        hourlyRate: rate ? Number(rate) : undefined,
        subjects,
        profileLinks: normalizeProfileLinksForSave(profileLinks),
      });
    } catch (err) {
      setSaveError((err as Error).message);
    }
  }

  const hasPdf = Boolean(profile.cv_pdf_path);
  const isCoursesTab = variant === "courses-tab";

  if (isLoading) {
    return (
      <Card className="border-line">
        <CardContent className="py-8">
          <p className="text-sm text-ink-400">Chargement du profil public…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      id={variant === "standalone" ? "teacher-public-profile" : undefined}
      className="border-line"
    >
      <CardHeader>
        <CardTitle className="text-base">
          {isCoursesTab ? "Profil public (raccourci)" : "Profil visible par les élèves"}
        </CardTitle>
        <CardDescription>
          Tarif actuel :{" "}
          {hourlyRate ? formatEuro(hourlyRate) : "non défini"}
          {isCoursesTab ? (
            <>
              {" · "}
              <Link to="/app/profil" className="text-brand-600 hover:underline">
                Éditer sur Mon profil →
              </Link>
            </>
          ) : (
            " — présentation, matières et tarif affichés sur votre fiche campus"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {marketplace?.visible && profile.id && !isCoursesTab ? (
          <Button size="sm" variant="outline" asChild>
            <Link to={`/app/cours/${profile.id}`}>Voir ma fiche élève →</Link>
          </Button>
        ) : null}

        <div className="space-y-1">
          <Label htmlFor="teacher-bio">Présentation courte</Label>
          <textarea
            id="teacher-bio"
            className="min-h-[80px] w-full rounded-md border border-line p-2 text-sm"
            placeholder="Résumé en quelques lignes…"
            maxLength={BIO_MAX_LENGTH}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <p className="text-xs text-ink-400">
            {bio.length} / {BIO_MAX_LENGTH}
          </p>
        </div>

        {isCoursesTab ? (
          <div className="rounded-lg border border-line bg-paper/80 p-4">
            <p className="text-sm font-medium text-ink-900">CV (texte ou PDF)</p>
            <p className="mt-1 text-sm text-ink-600">
              Géré depuis Mon profil — visible par les élèves lors du choix d&apos;un
              professeur.
              {hasPdf ? " Votre CV PDF est déjà en ligne." : ""}
            </p>
            <Button className="mt-3" size="sm" variant="outline" asChild>
              <Link to="/app/profil">Gérer mon CV →</Link>
            </Button>
          </div>
        ) : null}

        <TeacherProfileLinksEditor
          links={profileLinks}
          onChange={setProfileLinks}
        />

        <div className="space-y-1">
          <Label htmlFor="teacher-rate">Tarif horaire (€)</Label>
          <Input
            id="teacher-rate"
            type="number"
            min={1}
            step={0.5}
            placeholder="40"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="teacher-subject-draft">Matières enseignées</Label>
          {subjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <span
                  key={subject}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                >
                  {subject}
                  <button
                    type="button"
                    className="text-brand-600 hover:text-brand-700"
                    aria-label={`Retirer ${subject}`}
                    onClick={() => removeSubject(subject)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400">Aucune matière renseignée.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Input
              id="teacher-subject-draft"
              className="max-w-xs"
              placeholder="Ex. Maths"
              value={subjectDraft}
              onChange={(e) => setSubjectDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSubject();
                }
              }}
            />
            <Button size="sm" variant="outline" type="button" onClick={addSubject}>
              Ajouter
            </Button>
          </div>
        </div>

        {saveError ? (
          <p className="text-sm text-danger" role="alert">
            {saveError}
          </p>
        ) : null}
        {saveSuccess ? (
          <p className="text-sm text-success" role="status">
            Profil public enregistré.
          </p>
        ) : null}
        <Button
          size="sm"
          disabled={updateProfile.isPending}
          onClick={() => void saveProfile()}
        >
          {updateProfile.isPending ? "Enregistrement…" : "Enregistrer le profil public"}
        </Button>
      </CardContent>
    </Card>
  );
}
