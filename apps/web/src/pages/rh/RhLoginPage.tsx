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
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/features/auth/AuthProvider";
import { setAuthRedirect } from "@/features/auth/authStorage";
import { apiFetch } from "@/lib/api";

const RH_EMAIL = "jules.henri@ensam.eu";
const IS_DEV = import.meta.env.DEV;
const USE_EMAIL_LOGIN =
  import.meta.env.DEV || import.meta.env.VITE_USE_EMAIL_LOGIN === "true";

const magicLinkSchema = z.object({
  email: z
    .string()
    .email("Adresse e-mail invalide")
    .refine(
      (e) => e.trim().toLowerCase() === RH_EMAIL,
      `Seule l'adresse ${RH_EMAIL} est autorisée`,
    ),
});

const passwordLoginSchema = magicLinkSchema.extend({
  password: z.string().min(1, "Mot de passe requis"),
});

type MagicLinkForm = z.infer<typeof magicLinkSchema>;
type PasswordLoginForm = z.infer<typeof passwordLoginSchema>;

export function RhLoginPage() {
  const navigate = useNavigate();
  const { emailLogin } = useAuth();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [devLoading, setDevLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordLoginForm>({
    resolver: zodResolver(USE_EMAIL_LOGIN ? passwordLoginSchema : magicLinkSchema),
    defaultValues: {
      email: RH_EMAIL,
      password: "",
    },
  });

  const isRateLimit =
    serverError?.toLowerCase().includes("rate limit") ||
    serverError?.toLowerCase().includes("trop de tentatives");

  async function onMagicLinkSubmit({ email }: MagicLinkForm) {
    setServerError(null);
    const redirectTo = `${window.location.origin}/auth/callback`;
    setAuthRedirect("/admin");

    try {
      await apiFetch<{ data: { sent: boolean } }>("/api/auth/magic-link", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          redirectTo,
          intent: "rh",
        }),
      });
      setSent(true);
    } catch (err) {
      setServerError((err as Error).message);
    }
  }

  async function onPasswordSubmit({ email, password }: PasswordLoginForm) {
    setServerError(null);
    setDevLoading(true);
    const { error } = await emailLogin(email, password);
    setDevLoading(false);
    if (error) {
      setServerError(error);
      return;
    }
    navigate("/admin", { replace: true });
  }

  if (sent) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center bg-brand-50/30 p-8">
        <Card className="w-full border-brand-100">
          <CardHeader>
            <CardTitle>Vérifiez votre boîte mail</CardTitle>
            <CardDescription>
              Un lien de connexion a été envoyé à {RH_EMAIL}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-ink-600">
            <p>Après connexion, vous serez redirigé vers le pilotage RH.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 bg-brand-50/30 p-8">
      <Link to="/" className="text-sm text-ink-400 hover:text-ink-900">
        ← Accueil
      </Link>
      <Card className="border-brand-100">
        <CardHeader>
          <CardTitle>Plateforme RH</CardTitle>
          <CardDescription>
            Accès réservé à <strong>{RH_EMAIL}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handleSubmit(
              USE_EMAIL_LOGIN ? onPasswordSubmit : onMagicLinkSubmit,
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">E-mail autorisé</Label>
              <Input
                id="email"
                type="email"
                readOnly
                className="bg-paper"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-danger">{errors.email.message}</p>
              )}
            </div>

            {USE_EMAIL_LOGIN ? (
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Pilotage-RH!"
                  autoComplete="current-password"
                  {...register("password")}
                />
                {errors.password ? (
                  <p className="text-sm text-danger">
                    {errors.password.message}
                  </p>
                ) : null}
                {IS_DEV ? (
                  <p className="text-xs text-ink-400">
                    Démo locale : <span className="font-mono">Pilotage-RH!</span>
                  </p>
                ) : null}
              </div>
            ) : null}

            {serverError && (
              <div className="space-y-2">
                <p className="text-sm text-danger">{serverError}</p>
                {isRateLimit && (
                  <p className="text-xs text-ink-400">
                    Supabase limite le nombre d&apos;e-mails par heure après
                    plusieurs tests.
                  </p>
                )}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700"
              disabled={isSubmitting || devLoading}
            >
              {USE_EMAIL_LOGIN
                ? devLoading
                  ? "Connexion…"
                  : "Se connecter"
                : isSubmitting
                  ? "Envoi…"
                  : "Recevoir le lien magique RH"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
