import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@gadz-connect/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/features/auth/AuthProvider";

const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { signInWithMagicLink } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname
    ?? "/onboarding/micro-entreprise";

  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit({ email }: LoginForm) {
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
              Un lien de connexion Magic Link a été envoyé. Cliquez dessus pour
              accéder à Gadz&apos;Connect.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Après connexion, vous serez redirigé vers votre parcours.
            </p>
          </CardContent>
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
          <CardTitle>Connexion</CardTitle>
          <CardDescription>
            Magic Link — sans mot de passe (Supabase Auth)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="prenom.nom@etu.ensam.eu"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            {serverError && (
              <p className="text-sm text-red-600">{serverError}</p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Recevoir le lien magique
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
