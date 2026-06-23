import {
  Button,
  cn,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gadz-connect/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, Sparkles, UserCheck, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { AUTH_REDIRECT_KEY, setAuthIntent } from "@/features/auth/authStorage";
import { marketplaceRoutes } from "@/features/marketplace/marketplaceRoutes";
import {
  campusDisplayName,
  SELECTED_CAMPUS_KEY,
  sortCampuses,
} from "@/features/campus/campusLabels";
import { useAuth } from "@/features/auth/AuthProvider";
import { resolvePostLoginPath } from "@/features/auth/resolvePostLoginPath";
import { AppLogo } from "@/features/layout/AppLogo";
import { apiFetch } from "@/lib/api";

const USE_EMAIL_LOGIN =
  import.meta.env.DEV || import.meta.env.VITE_USE_EMAIL_LOGIN === "true";

const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Mot de passe requis"),
  campusId: z.string().uuid("Choisissez votre campus / ville"),
});

type LoginForm = z.infer<typeof loginSchema>;

function getStoredCampusId(): string {
  return sessionStorage.getItem(SELECTED_CAMPUS_KEY) ?? "";
}

function AuthShell({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:grid-cols-[minmax(0,1fr)_28rem]">
      {aside ? (
        <aside className="relative hidden overflow-hidden border-r border-line bg-surface-alt lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-100/60 blur-3xl"
            aria-hidden
          />
          {aside}
        </aside>
      ) : null}

      <div className="flex min-h-screen flex-col">
        <header className="flex justify-center px-5 py-5 sm:px-8 lg:hidden">
          <AppLogo className="h-8" decorative />
        </header>

        <main className="flex flex-1 flex-col justify-center px-5 pb-10 sm:px-8 lg:px-10 lg:pb-14">
          {children}
        </main>
      </div>
    </div>
  );
}

function HelpCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof UserCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-line/80 bg-surface/80 p-4 backdrop-blur-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-900">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-ink-600">{description}</p>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { user, loading: authLoading, signInWithMagicLink, emailLogin, getAccessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const teacherIntent = searchParams.get("intent") === "teacher";
  const from =
    (location.state as { from?: { pathname: string; search?: string } })?.from
      ?.pathname ??
    sessionStorage.getItem(AUTH_REDIRECT_KEY) ??
    "/app";
  const fromSearch =
    (location.state as { from?: { search?: string } })?.from?.search ?? "";
  const redirectTarget = `${from}${fromSearch}`;

  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: demoAccounts } = useQuery({
    queryKey: ["demo-accounts"],
    queryFn: () =>
      apiFetch<{
        data: Array<{ email: string; password: string; label: string }>;
      }>("/api/auth/demo-accounts"),
    enabled: USE_EMAIL_LOGIN,
  });

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
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: import.meta.env.DEV ? "prof.enattente@ensam.eu" : "",
      password: "",
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

  useEffect(() => {
    if (teacherIntent) setAuthIntent("teacher");
  }, [teacherIntent]);

  async function goToWorkspace() {
    const token = getAccessToken();
    if (token) {
      const path = await resolvePostLoginPath(token);
      navigate(path, { replace: true });
      return;
    }
    navigate("/app", { replace: true });
  }

  const connectedBanner =
    !authLoading && user ? (
      <div className="mb-6 rounded-lg border border-brand-100 bg-brand-50 p-4 text-sm text-ink-700">
        <p className="font-medium text-ink-900">Vous êtes déjà connecté.</p>
        <Button
          type="button"
          size="sm"
          className="mt-3"
          onClick={() => void goToWorkspace()}
        >
          Aller à mon espace
        </Button>
      </div>
    ) : null;

  async function onEmailLogin({ email, password, campusId }: LoginForm) {
    setServerError(null);
    persistCampus(campusId);
    setLoading(true);
    const { error, accessToken, profileSetupComplete } = await emailLogin(
      email,
      password,
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
      : redirectTarget;
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
    sessionStorage.setItem(AUTH_REDIRECT_KEY, redirectTarget);
  }

  const helpAside = (
    <>
      <div className="relative">
        <AppLogo className="h-10" />
        <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-brand-600">
          Gadz&apos;Connect
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink-900 xl:text-4xl">
          Plateforme inter-campus
        </h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-ink-600">
          Mise en relation, cours et micro-entreprise pour les campus Arts et
          Métiers.
        </p>
      </div>

      {USE_EMAIL_LOGIN ? (
        <div className="relative mt-10 space-y-3">
          <HelpCard
            icon={UserCheck}
            title="Compte existant"
            description="Accès direct à votre espace élève, prof ou RH sur le campus choisi."
          />
          <HelpCard
            icon={Sparkles}
            title="Première connexion"
            description="Inscription guidée selon votre profil — élève ou prof."
          />
          {teacherIntent ? (
            <HelpCard
              icon={UserCheck}
              title="Parcours professeur"
              description="Après connexion, vous choisirez le profil enseignant et la micro-entreprise."
            />
          ) : null}
        </div>
      ) : null}
    </>
  );

  if (sent) {
    return (
      <AuthShell aside={helpAside}>
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-xl border border-line bg-surface p-8 shadow-raised sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-center font-display text-2xl font-semibold text-ink-900">
              Vérifiez votre boîte mail
            </h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-ink-600">
              Un lien de connexion vient d&apos;être envoyé à votre adresse
              e-mail. Cliquez dessus pour accéder à votre espace.
            </p>
            <Button
              variant="outline"
              className="mt-8 w-full"
              onClick={() => setSent(false)}
            >
              Utiliser une autre adresse
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell aside={helpAside}>
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 lg:hidden">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Gadz&apos;Connect
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink-900">
            Plateforme inter-campus
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
            Mise en relation, cours et micro-entreprise pour les campus Arts et
            Métiers.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-6 shadow-raised sm:p-8">
          {connectedBanner}
          <div className="hidden lg:block">
            <h2 className="font-display text-xl font-semibold text-ink-900">
              Connexion
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              {USE_EMAIL_LOGIN
                ? "Campus, e-mail @ensam.eu et mot de passe personnel."
                : "Campus et e-mail — connexion par lien magique."}
            </p>
          </div>

          <form
            onSubmit={handleSubmit(
              USE_EMAIL_LOGIN ? onEmailLogin : onMagicLink,
            )}
            className={cn("space-y-6", "lg:mt-6")}
          >
            <fieldset className="space-y-5">
              <legend className="sr-only">Identifiants de connexion</legend>

              <div className="space-y-2">
                <Label htmlFor="campusId" className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-ink-400" />
                  Campus / ville
                </Label>
                <Controller
                  name="campusId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        persistCampus(value);
                      }}
                      disabled={campusesLoading}
                    >
                      <SelectTrigger id="campusId" aria-invalid={Boolean(errors.campusId)}>
                        <SelectValue
                          placeholder={
                            campusesLoading
                              ? "Chargement…"
                              : "Sélectionner votre ville"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedCampuses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {campusDisplayName(c.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.campusId ? (
                  <p className="text-sm text-danger">{errors.campusId.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-ink-400" />
                  E-mail Arts et Métiers
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="prenom.nom@etu.ensam.eu"
                  autoComplete="username"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="text-sm text-danger">{errors.email.message}</p>
                ) : null}
              </div>

              {USE_EMAIL_LOGIN ? (
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-ink-400" />
                    Mot de passe
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Votre mot de passe"
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    {...register("password")}
                  />
                  {errors.password ? (
                    <p className="text-sm text-danger">
                      {errors.password.message}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </fieldset>

            {serverError ? (
              <p
                className="rounded-sm border border-danger/20 bg-danger-bg px-3 py-2 text-sm text-danger"
                role="alert"
              >
                {serverError}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading || isSubmitting || campusesLoading}
            >
              {loading ? "Connexion…" : "Continuer"}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-ink-600">
          <Link to="/" className="font-medium text-brand-700 hover:underline">
            Continuer sans compte
          </Link>
          {" · "}
          <Link
            to={marketplaceRoutes.login("teacher")}
            className="font-medium text-brand-700 hover:underline"
          >
            Espace prof
          </Link>
        </p>

        {USE_EMAIL_LOGIN && demoAccounts?.data?.length ? (
          <details className="mt-6 rounded-lg border border-line bg-surface/80 p-4 text-sm">
            <summary className="cursor-pointer font-medium text-ink-900">
              Comptes démo (mots de passe)
            </summary>
            <ul className="mt-3 space-y-2 text-ink-600">
              {demoAccounts.data.map((account) => (
                <li key={account.email} className="rounded-md bg-paper px-3 py-2">
                  <p className="font-medium text-ink-900">{account.email}</p>
                  <p className="font-mono text-xs text-brand-700">
                    {account.password}
                  </p>
                  <p className="text-xs text-ink-400">{account.label}</p>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </AuthShell>
  );
}
