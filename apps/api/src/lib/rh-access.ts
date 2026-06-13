/** Adresses autorisées pour la plateforme RH (pilotage admin).
 *  Variable d'environnement : RH_ALLOWED_EMAILS (liste séparée par des virgules).
 */
export function getRhAllowedEmails(): string[] {
  const raw =
    process.env.RH_ALLOWED_EMAILS ?? "jules.henri@ensam.eu";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isRhAllowedEmail(email: string | undefined): boolean {
  if (!email) return false;
  return getRhAllowedEmails().includes(email.trim().toLowerCase());
}
