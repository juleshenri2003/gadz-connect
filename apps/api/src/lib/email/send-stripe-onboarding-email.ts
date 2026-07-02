import {
  deliverResendEmail,
  getAppBaseUrl,
  getPlatformEmailFrom,
  getResendApiKey,
  type ResendSendResult,
} from "./resend-config.js";

export type StripeOnboardingEmailVariant = "welcome" | "reminder";

export interface SendStripeOnboardingEmailInput {
  to: string;
  firstName: string;
  variant: StripeOnboardingEmailVariant;
}

function buildPaymentsUrl(): string {
  return `${getAppBaseUrl()}/app/paiements`;
}

export function buildSubject(variant: StripeOnboardingEmailVariant): string {
  if (variant === "reminder") {
    return "Rappel — configurez vos paiements sur Gadz'Connect";
  }
  return "Gadz'Connect — dernière étape : recevoir vos virements";
}

function buildHtml(
  input: SendStripeOnboardingEmailInput,
  ctx: { redirected: boolean; intendedTo: string },
): string {
  const paymentsUrl = buildPaymentsUrl();
  const greeting = input.firstName.trim() || "Bonjour";
  const redirectNote = ctx.redirected
    ? `<p><em>[Dev] E-mail redirigé — destinataire prévu : ${ctx.intendedTo}</em></p>`
    : "";

  if (input.variant === "reminder") {
    return `
      ${redirectNote}
      <p>Bonjour ${greeting},</p>
      <p>Votre compte professeur est actif, mais la configuration <strong>Stripe Connect</strong> n'est pas encore terminée.</p>
      <p>Sans cette étape (~5–10 min), vous ne pourrez pas recevoir les virements après les cours réservés par les élèves.</p>
      <p><a href="${paymentsUrl}">Configurer mes paiements sur Gadz'Connect</a></p>
      <p>Cordialement,<br/>L'équipe Gadz'Connect</p>
    `.trim();
  }

  return `
    ${redirectNote}
    <p>Bonjour ${greeting},</p>
    <p>Votre profil Gadz'Connect est activé — merci !</p>
    <p>Il reste une étape pour recevoir vos virements après chaque cours : configurez <strong>Stripe Connect</strong> (identité + IBAN, environ 5–10 minutes, à faire une seule fois).</p>
    <p><a href="${paymentsUrl}">Configurer mes paiements</a></p>
    <p>Vous pourrez ensuite publier vos créneaux et apparaître dans la marketplace de votre campus.</p>
    <p>Cordialement,<br/>L'équipe Gadz'Connect</p>
  `.trim();
}

/**
 * E-mail d'onboarding Stripe Connect (Resend).
 * Sans RESEND_API_KEY : skipped (notification in-app seulement).
 */
export async function sendStripeOnboardingEmail(
  input: SendStripeOnboardingEmailInput,
): Promise<ResendSendResult> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY absent — e-mail Stripe Connect non envoyé",
    );
    return { sent: false, skipped: true, reason: "RESEND_API_KEY non configurée" };
  }

  const delivery = await deliverResendEmail({
    apiKey,
    intendedTo: input.to,
    from: getPlatformEmailFrom(),
    subject: buildSubject(input.variant),
    buildHtml: (ctx) => buildHtml(input, ctx),
  });

  if (!delivery.ok) {
    console.error(
      "[email] Stripe onboarding:",
      delivery.status,
      delivery.body,
    );
    return {
      sent: false,
      skipped: false,
      reason: `Resend HTTP ${delivery.status}`,
    };
  }

  return { sent: true, skipped: false };
}
