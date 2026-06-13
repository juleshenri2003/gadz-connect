import { Button, Card, CardContent, CardHeader, CardTitle } from "@gadz-connect/ui";
import { Link } from "react-router-dom";
import { useStripeConnectStatus } from "@/features/stripe/useStripeConnect";

export function StripeReturnPage() {
  const { data, isLoading, refetch } = useStripeConnectStatus();

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-ink-400">Vérification du compte…</p>
          ) : data?.onboardingComplete ? (
            <>
              <p className="text-sm text-success">
                Votre compte Express est actif. Les virements sont activés.
              </p>
              <Button size="sm" variant="outline" asChild>
                <Link to="/app/cours">Publier vos créneaux</Link>
              </Button>
            </>
          ) : (
            <p className="text-sm text-warning">
              L&apos;onboarding Stripe n&apos;est pas encore terminé. Complétez
              les étapes depuis votre espace prestataire.
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              Actualiser
            </Button>
            <Button asChild>
              <Link to="/app/paiements">Retour espace prestataire</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
