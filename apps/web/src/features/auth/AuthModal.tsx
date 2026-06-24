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
import { Lock, Mail, MapPin } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Modal } from "@/components/Modal";
import {
  campusDisplayName,
  defaultCampusId,
  getStoredCampusId,
  persistCampusId,
} from "@/features/campus/campusLabels";
import { useCampusOptions } from "@/features/campus/useCampusOptions";
import { useAuth } from "@/features/auth/AuthProvider";
import { setAuthIntent, AUTH_REDIRECT_KEY } from "@/features/auth/authStorage";
import {
  AuthModalContext,
  type AuthModalOptions,
  type AuthModalView,
} from "@/features/auth/authModalContext";
import { resolvePostLoginPath } from "@/features/auth/resolvePostLoginPath";

export type { AuthModalMode, AuthModalRole, AuthModalView } from "@/features/auth/authModalContext";

const USE_EMAIL_LOGIN =
  import.meta.env.DEV || import.meta.env.VITE_USE_EMAIL_LOGIN === "true";

function createAuthFormSchema() {
  return z
    .object({
      email: z.string().email("Adresse e-mail invalide"),
      password: z.string(),
      campusId: z.string(),
    })
    .superRefine((data, ctx) => {
      if (USE_EMAIL_LOGIN && !data.password.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Mot de passe requis",
          path: ["password"],
        });
      }
    });
}

type AuthFormValues = z.infer<ReturnType<typeof createAuthFormSchema>>;

function copyFor(view: AuthModalView): {
  title: string;
  description: string;
  submit: string;
} {
  if (view.mode === "signup" && view.role === "student") {
    return {
      title: "Créer un compte élève",
      description:
        "Mail @etu.ensam.eu ou @ensam.eu — la première connexion active votre compte.",
      submit: "Créer mon compte",
    };
  }
  if (view.mode === "login" && view.role === "student") {
    return {
      title: "Connexion élève",
      description: "Accédez à vos réservations et cours sur votre campus.",
      submit: "Se connecter",
    };
  }
  if (view.mode === "signup" && view.role === "teacher") {
    return {
      title: "Créer un compte prof",
      description:
        "Proposez vos cours — micro-entreprise et créneaux gérés sur la plateforme.",
      submit: "Créer ma fiche prof",
    };
  }
  return {
    title: "Connexion prof",
    description: "Accédez à votre espace professeur et à vos créneaux.",
    submit: "Se connecter",
  };
}

function RoleToggle({
  role,
  onChange,
}: {
  role: AuthModalRole;
  onChange: (role: AuthModalRole) => void;
}) {
  return (
    <div
      className="flex rounded-md border border-line bg-paper p-1"
      role="tablist"
      aria-label="Profil"
    >
      {(
        [
          ["student", "Élève"],
          ["teacher", "Prof"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={role === value}
          className={cn(
            "flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition",
            role === value
              ? "bg-surface text-ink-900 shadow-sm"
              : "text-ink-500 hover:text-ink-700",
          )}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function AuthModalPanel({
  open,
  view,
  onViewChange,
  onClose,
}: {
  open: boolean;
  view: AuthModalView;
  onViewChange: (view: AuthModalView) => void;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const formId = useId();
  const { signInWithMagicLink, emailLogin } = useAuth();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignup = view.mode === "signup";

  const {
    campuses: sortedCampuses,
    isLoading: campusesLoading,
    isError: campusesError,
  } = useCampusOptions(open && isSignup);
  const copy = copyFor(view);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    reset,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(createAuthFormSchema()),
    defaultValues: {
      email: "",
      password: "",
      campusId: getStoredCampusId(),
    },
  });

  useEffect(() => {
    clearErrors("campusId");
  }, [isSignup, clearErrors]);

  useEffect(() => {
    if (!open) {
      setSent(false);
      setServerError(null);
      setLoading(false);
      reset({
        email: "",
        password: "",
        campusId: getStoredCampusId(),
      });
    }
  }, [open, reset]);

  useEffect(() => {
    if (!open || !isSignup || !sortedCampuses.length) return;
    const stored = getStoredCampusId();
    if (stored && sortedCampuses.some((c) => c.id === stored)) {
      setValue("campusId", stored);
      return;
    }
    const fallback = defaultCampusId(sortedCampuses);
    if (fallback) {
      setValue("campusId", fallback);
      persistCampusId(fallback);
    }
  }, [open, isSignup, sortedCampuses, setValue]);

  async function finishLogin(
    accessToken?: string,
    profileSetupComplete?: boolean,
  ) {
    setAuthIntent(view.role);
    onClose();
    if (!profileSetupComplete) {
      navigate("/app/setup", { replace: true });
      return;
    }
    const path = accessToken
      ? await resolvePostLoginPath(accessToken)
      : "/app";
    navigate(path, { replace: true });
  }

  async function onEmailLogin(values: AuthFormValues) {
    setServerError(null);
    if (isSignup && !z.string().uuid().safeParse(values.campusId).success) {
      setError("campusId", { message: "Choisissez votre ville" });
      return;
    }
    setAuthIntent(view.role);
    setLoading(true);
    const campusId = isSignup ? values.campusId : undefined;
    if (isSignup && campusId) {
      persistCampusId(campusId);
    }
    const { error, accessToken, profileSetupComplete } = await emailLogin(
      values.email,
      values.password,
      campusId,
    );
    setLoading(false);
    if (error) {
      setServerError(error);
      return;
    }
    await finishLogin(accessToken, profileSetupComplete);
  }

  async function onMagicLink(values: AuthFormValues) {
    setServerError(null);
    if (isSignup && !z.string().uuid().safeParse(values.campusId).success) {
      setError("campusId", { message: "Choisissez votre ville" });
      return;
    }
    if (isSignup && values.campusId) {
      persistCampusId(values.campusId);
    }
    setAuthIntent(view.role);
    sessionStorage.setItem(
      AUTH_REDIRECT_KEY,
      `${window.location.pathname}${window.location.search}`,
    );
    const { error } = await signInWithMagicLink(values.email);
    if (error) {
      setServerError(error);
      return;
    }
    setSent(true);
  }

  function toggleMode() {
    onViewChange({
      ...view,
      mode: view.mode === "signup" ? "login" : "signup",
    });
    setServerError(null);
    setSent(false);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={sent ? "Vérifiez votre boîte mail" : copy.title}
      description={
        sent
          ? "Un lien de connexion vient d'être envoyé à votre adresse e-mail."
          : copy.description
      }
      className="max-w-md"
      footer={
        sent ? (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <Button onClick={() => setSent(false)}>Autre adresse</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="text-left text-sm text-brand-700 hover:underline"
              onClick={toggleMode}
            >
              {view.mode === "signup"
                ? "Déjà un compte ? Se connecter"
                : "Pas encore de compte ? S'inscrire"}
            </button>
            <Button
              type="submit"
              form={formId}
              disabled={
                loading || isSubmitting || (isSignup && campusesLoading)
              }
            >
              {loading ? "Envoi…" : copy.submit}
            </Button>
          </div>
        )
      }
    >
      {sent ? (
        <p className="text-sm text-ink-600">
          Cliquez sur le lien reçu pour accéder à votre espace. Pensez à vérifier
          vos spams.
        </p>
      ) : (
        <div className="space-y-4">
          <RoleToggle
            role={view.role}
            onChange={(role) => {
              onViewChange({ ...view, role });
              setServerError(null);
            }}
          />

          <form
            id={formId}
            className="space-y-4"
            onSubmit={handleSubmit(
              USE_EMAIL_LOGIN ? onEmailLogin : onMagicLink,
            )}
          >
            {isSignup ? (
              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-campus`}
                  className="flex items-center gap-1.5"
                >
                  <MapPin className="h-3.5 w-3.5 text-ink-400" />
                  Ville
                </Label>
                <Controller
                  name="campusId"
                  control={control}
                  render={({ field }) =>
                    campusesLoading ? (
                      <div
                        id={`${formId}-campus`}
                        className="flex h-10 items-center rounded-md border border-line bg-surface px-3 text-sm text-ink-400"
                      >
                        Chargement…
                      </div>
                    ) : campusesError || sortedCampuses.length === 0 ? (
                      <div
                        id={`${formId}-campus`}
                        className="flex h-10 items-center rounded-md border border-danger/30 bg-danger-bg px-3 text-sm text-danger"
                      >
                        Impossible de charger les villes
                      </div>
                    ) : (
                      <Select
                        value={field.value || sortedCampuses[0]!.id}
                        onValueChange={(value) => {
                          field.onChange(value);
                          persistCampusId(value);
                        }}
                      >
                        <SelectTrigger id={`${formId}-campus`}>
                          <SelectValue placeholder="Choisir une ville" />
                        </SelectTrigger>
                        <SelectContent className="min-w-[16rem]">
                          {sortedCampuses.map((campus) => (
                            <SelectItem key={campus.id} value={campus.id}>
                              {campusDisplayName(campus.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  }
                />
                {errors.campusId ? (
                  <p className="text-sm text-danger">
                    {errors.campusId.message}
                  </p>
                ) : (
                  <p className="text-xs text-ink-400">
                    Modifiable à tout moment dans votre profil.
                  </p>
                )}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label
                htmlFor={`${formId}-email`}
                className="flex items-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5 text-ink-400" />
                E-mail Arts et Métiers
              </Label>
              <Input
                id={`${formId}-email`}
                type="email"
                placeholder={
                  view.role === "teacher"
                    ? "prenom.nom@ensam.eu"
                    : "prenom.nom@etu.ensam.eu"
                }
                autoComplete="username"
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-sm text-danger">{errors.email.message}</p>
              ) : null}
            </div>

            {USE_EMAIL_LOGIN ? (
              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-password`}
                  className="flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5 text-ink-400" />
                  Mot de passe
                </Label>
                <Input
                  id={`${formId}-password`}
                  type="password"
                  placeholder="Votre mot de passe"
                  autoComplete={
                    view.mode === "signup" ? "new-password" : "current-password"
                  }
                  {...register("password")}
                />
                {errors.password ? (
                  <p className="text-sm text-danger">{errors.password.message}</p>
                ) : null}
              </div>
            ) : null}

            {serverError ? (
              <p
                className="rounded-sm border border-danger/20 bg-danger-bg px-3 py-2 text-sm text-danger"
                role="alert"
              >
                {serverError}
              </p>
            ) : null}
          </form>
        </div>
      )}
    </Modal>
  );
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AuthModalView>({
    mode: "signup",
    role: "student",
  });

  const openAuthModal = useCallback((options?: AuthModalOptions) => {
    setView({
      mode: options?.mode ?? "signup",
      role: options?.role ?? "student",
    });
    setOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setOpen(false), []);

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <AuthModalPanel
        open={open}
        view={view}
        onViewChange={setView}
        onClose={closeAuthModal}
      />
    </AuthModalContext.Provider>
  );
}
