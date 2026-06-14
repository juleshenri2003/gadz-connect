/** Comptes démo locaux — mots de passe distincts par persona (dev uniquement). */

export interface DemoAccount {
  password: string;
  label: string;
}

export const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  "prof.enattente@ensam.eu": {
    password: "Prof-EnAttente!",
    label: "Prof en attente SIRET (onboarding)",
  },
  "prof.martin@ensam.eu": {
    password: "Prof-Martin!",
    label: "Prof actif (démo)",
  },
  "prof.express@ensam.eu": {
    password: "Prof-Express!",
    label: "Prof parcours express (SIRET existant)",
  },
  "prof.complet@ensam.eu": {
    password: "Prof-Complet!",
    label: "Prof post-INPI, SIRET à déclarer",
  },
  "prof.suspended@ensam.eu": {
    password: "Prof-Suspendu!",
    label: "Prof suspendu",
  },
  "eleve.dupont@ensam.eu": {
    password: "Eleve-Dupont!",
    label: "Élève démo",
  },
  "jules.henri@ensam.eu": {
    password: "Pilotage-RH!",
    label: "Admin RH",
  },
};

export function getDemoAccount(email: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS[email.trim().toLowerCase()];
}

export function listDemoAccounts(): Array<{ email: string } & DemoAccount> {
  return Object.entries(DEMO_ACCOUNTS).map(([email, account]) => ({
    email,
    ...account,
  }));
}
