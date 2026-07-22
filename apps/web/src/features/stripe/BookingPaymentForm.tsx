import { useMemo, useState } from "react";
import { Button } from "@gadz-connect/ui";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
  type StripeElementsOptions,
  type StripeExpressCheckoutElementConfirmEvent,
} from "@stripe/stripe-js";

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
  const [expressReady, setExpressReady] = useState(false);

  async function confirmWithElements() {
    if (!stripe || !elements) return false;

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "Le paiement a échoué");
      return false;
    }

    return true;
  }

  async function handleCardSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);
    const ok = await confirmWithElements();
    setSubmitting(false);
    if (ok) onSuccess();
  }

  async function handleExpressConfirm(
    event: StripeExpressCheckoutElementConfirmEvent,
  ) {
    if (!stripe || !elements) {
      event.paymentFailed({ reason: "fail" });
      return;
    }

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
      event.paymentFailed({ reason: "fail" });
      return;
    }

    onSuccess();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-600">
        Montant à régler : <strong>{amountLabel}</strong>
      </p>
      <p className="text-xs text-ink-500">
        Carte bancaire, Apple Pay ou Google Pay — selon ce que votre appareil
        propose.
      </p>

      <div className={expressReady ? "space-y-2" : "hidden"}>
        <ExpressCheckoutElement
          options={{
            buttonType: {
              applePay: "buy",
              googlePay: "buy",
            },
            buttonTheme: {
              applePay: "black",
              googlePay: "black",
            },
            paymentMethods: {
              applePay: "always",
              googlePay: "always",
              link: "auto",
              paypal: "never",
              amazonPay: "never",
              klarna: "never",
            },
          }}
          onReady={({ availablePaymentMethods }) => {
            const hasWallet = Boolean(
              availablePaymentMethods &&
                (availablePaymentMethods.applePay ||
                  availablePaymentMethods.googlePay ||
                  availablePaymentMethods.link),
            );
            setExpressReady(hasWallet);
          }}
          onConfirm={(event) => {
            void handleExpressConfirm(event);
          }}
        />
        <div className="relative py-1 text-center text-xs text-ink-400">
          <span className="bg-surface px-2">ou payer par carte</span>
        </div>
      </div>

      <form onSubmit={(event) => void handleCardSubmit(event)} className="space-y-4">
        <PaymentElement
          options={{
            layout: "tabs",
            paymentMethodOrder: ["card"],
            // Wallets affichés dans Express Checkout pour éviter le doublon.
            wallets: {
              applePay: "never",
              googlePay: "never",
            },
          }}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={!stripe || submitting}>
            {submitting ? "Paiement…" : "Payer par carte"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function BookingPaymentForm({
  publishableKey,
  clientSecret,
  amountLabel,
  onSuccess,
  onCancel,
}: BookingPaymentFormProps) {
  const stripePromise = useMemo(
    () => loadStripe(publishableKey),
    [publishableKey],
  );
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: { theme: "stripe" },
    locale: "fr",
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
