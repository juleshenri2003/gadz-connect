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
import { apiFetch } from "@/lib/api";

const RH_EMAIL = "jules.henri@ensam.eu";
const IS_DEV = import.meta.env.DEV;

const loginSchema = z.object({
  email: z
    .string()
    .email("Adresse e-mail invalide")
    .refine(
      (e) => e.trim().toLowerCase() === RH_EMAIL,
      `Seule l'adresse ${RH_EMAIL} est autorisée`,
    ),
});

type LoginForm = z.infer<typeof loginSchema>;

export function RhLoginPage() {
  const navigate = useNavigate();
  const { devLogin } = useAuth();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [devLoading, setDevLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: RH_EMAIL },
  });

  const isRateLimit =
    serverError?.toLowerCase().includes("rate limit") ||
    serverError?.toLowerCase().includes("trop de tentatives");

  async function onSubmit({ email }: LoginForm) {
    setServerError(null);
    const redirectTo = `${window.location.origin}/auth/callback`;
    sessionStorage.setItem("gadz_auth_redirect", "/admin");

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

  async function handleDevLogin() {
    setServerError(null);
    setDevLoading(true);
    const { error } = await devLogin(RH_EMAIL);
    setDevLoading(false);
    if (error) {
      setServerError(error);
      return;
    }
    navigate("/admin", { replace: true });
  }

  if (sent) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center bg-indigo-50/30 p-8">
        <Card className="w-full border-indigo-100">
          <CardHeader>
            <CardTitle>Vérifiez votre boîte mail</CardTitle>
            <CardDescription>
              Un lien de connexion a été envoyé à {RH_EMAIL}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <p>Après connexion, vous serez redirigé vers le pilotage RH.</p>
            {IS_DEV ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={devLoading}
                onClick={() => void handleDevLogin()}
              >
                {devLoading
                  ? "Connexion…"
                  : "Connexion dev (sans e-mail)"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 bg-indigo-50/30 p-8">
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
        ← Accueil
      </Link>
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle>Plateforme RH</CardTitle>
          <CardDescription>
            Accès réservé à <strong>{RH_EMAIL}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail autorisé</Label>
              <Input
                id="email"
                type="email"
                readOnly
                className="bg-slate-50"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            {serverError && (
              <div className="space-y-2">
                <p className="text-sm text-red-600">{serverError}</p>
                {isRateLimit && (
                  <p className="text-xs text-slate-500">
                    Supabase limite le nombre d&apos;e-mails par heure après
                    plusieurs tests.
                  </p>
                )}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={isSubmitting}
            >
              Recevoir le lien magique RH
            </Button>
          </form>

          {IS_DEV ? (
            <div className="border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs text-slate-500">
                Développement local — connexion directe sans envoi d&apos;e-mail
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={devLoading}
                onClick={() => void handleDevLogin()}
              >
                {devLoading ? "Connexion…" : "Connexion dev → pilotage RH"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
