const ALLOWED_DOMAINS = ["ensam.eu", "etu.ensam.eu"] as const;

export function isSchoolEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  return ALLOWED_DOMAINS.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
  );
}

export function schoolEmailError(): string {
  return "Seules les adresses @ensam.eu et @etu.ensam.eu sont acceptées.";
}
