import type { AccountStatus, UserRole } from "@gadz-connect/types";

export interface AdminProfileRow {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  campus_id: string;
  siret: string | null;
  account_status: AccountStatus;
  micro_enterprise_activity: string | null;
  stripe_connect_account_id: string | null;
  stripe_connect_onboarding_complete: boolean;
  created_at: string;
  campus: { name: string } | null;
}

export interface AdminDashboardData {
  scope: "campus" | "global";
  profiles: {
    total: number;
    byStatus: Record<AccountStatus, number>;
    byRole: Record<string, number>;
  };
  courses: {
    total: number;
    byStatus: Record<string, number>;
    recent: Array<{
      id: string;
      title: string;
      status: string;
      created_at: string;
      campus: { name: string } | null;
    }>;
  };
  transactions: {
    total: number;
    byStripeStatus: Record<string, number>;
  };
  budgets: {
    volumeBrut: number;
    volumeCommissions: number;
    volumeUrssaf: number;
    volumeNetVerse: number;
    encaisseBrut: number;
    encaisseNet: number;
    enAttenteBrut: number;
  };
  stripeAccounts: {
    total: number;
    withAccount: number;
    onboardingComplete: number;
    pending: number;
    withoutAccount: number;
  };
}

export interface AdminMe {
  id: string;
  role: UserRole;
  campus_id: string;
  first_name: string;
  last_name: string;
}
