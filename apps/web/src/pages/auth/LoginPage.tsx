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
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/features/auth/AuthProvider";
import { resolvePostLoginPath } from "@/features/auth/resolvePostLoginPath";

const USE_EMAIL_LOGIN =
  import.meta.env.DEV || import.meta.env.VITE_USE_EMAIL_LOGIN === "true";

const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { signInWithMagicLink, emailLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname
    ?? "/app";

  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: import.meta.env.DEV ? "prof.enattente@ensam.eu" : "" },
  });

  async function onEmailLogin({ email }: LoginForm) {
    setServerError(null);
    setLoading(true);
    const { error, accessToken, profileSetupComplete } = await emailLogin(email);
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

  async function onMagicLink({ email }: LoginForm) {
    setServerError(null);
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
              ? "Saisissez votre e-mail école — accès direct à votre espace ou inscription."
              : "Magic Link — sans mot de passe"}
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
              disabled={loading || isSubmitting}
            >
              {loading ? "Connexion…" : "Continuer →"}
            </Button>
          </form>
          {USE_EMAIL_LOGIN ? (
            <p className="text-xs text-slate-500">
              Compte connu → votre interface (élève, prof ou RH).
              <br />
              Nouveau → choix du parcours (élève, micro-entreprise, SIRET).
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
