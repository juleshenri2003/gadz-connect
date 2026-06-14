import { useState } from "react";
import { Button } from "@gadz-connect/ui";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";

interface BookingPaymentFormProps {
  publishableKey: string;
  clientSecret: string;
  amountLabel: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentFormInner({
  amountLabel,
  onSuccess,
  onCancel,
}: Omit<BookingPaymentFormProps, "publishableKey" | "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    setSubmitting(false);

    if (submitError) {
      setError(submitError.message ?? "Le paiement a échoué");
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <p className="text-sm text-ink-600">
        Montant à régler : <strong>{amountLabel}</strong>
      </p>
      <PaymentElement />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={!stripe || submitting}>
          {submitting ? "Paiement…" : "Payer et confirmer"}
        </Button>
      </div>
    </form>
  );
}

export function BookingPaymentForm({
  publishableKey,
  clientSecret,
  amountLabel,
  onSuccess,
  onCancel,
}: BookingPaymentFormProps) {
  const stripePromise = loadStripe(publishableKey);
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: { theme: "stripe" },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormInner
        amountLabel={amountLabel}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}
