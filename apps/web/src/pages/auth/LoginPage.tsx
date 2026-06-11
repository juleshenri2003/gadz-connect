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
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  campusDisplayName,
  SELECTED_CAMPUS_KEY,
  sortCampuses,
} from "@/features/campus/campusLabels";
import { useAuth } from "@/features/auth/AuthProvider";
import { resolvePostLoginPath } from "@/features/auth/resolvePostLoginPath";
import { apiFetch } from "@/lib/api";

const USE_EMAIL_LOGIN =
  import.meta.env.DEV || import.meta.env.VITE_USE_EMAIL_LOGIN === "true";

const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  campusId: z.string().uuid("Choisissez votre campus / ville"),
});

type LoginForm = z.infer<typeof loginSchema>;

function getStoredCampusId(): string {
  return sessionStorage.getItem(SELECTED_CAMPUS_KEY) ?? "";
}

export function LoginPage() {
  const { signInWithMagicLink, emailLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname
    ?? "/app";

  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: campuses, isLoading: campusesLoading } = useQuery({
    queryKey: ["campus"],
    queryFn: () =>
      apiFetch<{ data: { id: string; name: string }[] }>("/api/campus"),
  });

  const sortedCampuses = campuses?.data
    ? sortCampuses(campuses.data)
    : [];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: import.meta.env.DEV ? "prof.enattente@ensam.eu" : "",
      campusId: getStoredCampusId(),
    },
  });

  function persistCampus(campusId: string) {
    sessionStorage.setItem(SELECTED_CAMPUS_KEY, campusId);
  }

  useEffect(() => {
    if (!sortedCampuses.length) return;
    const stored = getStoredCampusId();
    if (stored && sortedCampuses.some((c) => c.id === stored)) {
      setValue("campusId", stored);
      return;
    }
    const paris = sortedCampuses.find((c) => c.name === "Paris");
    if (paris) {
      setValue("campusId", paris.id);
      persistCampus(paris.id);
    }
  }, [sortedCampuses, setValue]);

  async function onEmailLogin({ email, campusId }: LoginForm) {
    setServerError(null);
    persistCampus(campusId);
    setLoading(true);
    const { error, accessToken, profileSetupComplete } = await emailLogin(
      email,
      campusId,
    );
    setLoading(false);
    if (error) {
      setServerError(error);
      return;
    }
    if (!profileSetupComplete) {
      navigate("/app/setup", { replace: true });
      return;
    }
    const path = accessToken
      ? await resolvePostLoginPath(accessToken)
      : from;
    navigate(path, { replace: true });
  }

  async function onMagicLink({ email, campusId }: LoginForm) {
    setServerError(null);
    persistCampus(campusId);
    const { error } = await signInWithMagicLink(email);
    if (error) {
      setServerError(error);
      return;
    }
    setSent(true);
    sessionStorage.setItem("gadz_auth_redirect", from);
  }

  if (sent) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center p-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Vérifiez votre boîte mail</CardTitle>
            <CardDescription>
              Un lien de connexion a été envoyé à votre adresse e-mail.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-8">
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
        ← Accueil
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Accéder à Gadz&apos;Connect</CardTitle>
          <CardDescription>
            {USE_EMAIL_LOGIN
              ? "Votre campus, puis votre e-mail — élève, prof ou RH."
              : "Campus et e-mail — connexion par Magic Link"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handleSubmit(
              USE_EMAIL_LOGIN ? onEmailLogin : onMagicLink,
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="campusId">Campus / ville</Label>
              <select
                id="campusId"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                disabled={campusesLoading}
                {...register("campusId")}
              >
                <option value="">
                  {campusesLoading ? "Chargement…" : "Sélectionner votre ville"}
                </option>
                {sortedCampuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {campusDisplayName(c.name)}
                  </option>
                ))}
              </select>
              {errors.campusId ? (
                <p className="text-sm text-red-600">{errors.campusId.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail Arts et Métiers</Label>
              <Input
                id="email"
                type="email"
                placeholder="prenom.nom@etu.ensam.eu"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              ) : null}
            </div>
            {serverError ? (
              <p className="text-sm text-red-600">{serverError}</p>
            ) : null}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || isSubmitting || campusesLoading}
            >
              {loading ? "Connexion…" : "Continuer →"}
            </Button>
          </form>
          {USE_EMAIL_LOGIN ? (
            <p className="text-xs text-slate-500">
              Compte connu → votre espace (élève, prof ou RH) sur le campus
              choisi.
              <br />
              Nouveau → inscription guidée (parcours élève ou prof).
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
