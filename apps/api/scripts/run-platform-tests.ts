/**
 * Exécution automatisée du plan de test plateforme (API + smoke).
 * Usage: pnpm --filter @gadz-connect/api run-platform-tests
 *
 * Prérequis: API sur API_URL (défaut http://localhost:3001), seeds démo, promote-rh-admin.
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { DEMO_ACCOUNTS } from "../src/lib/demo-accounts.js";

const API_URL = process.env.API_URL ?? "http://localhost:3001";
const VERCEL_API_URL = process.env.VERCEL_API_URL ?? "";
const REPORT_PATH = resolve(
  process.cwd(),
  "../../docs/TEST-EXECUTION-REPORT.md",
);

interface TestCase {
  id: string;
  section: string;
  name: string;
  pass: boolean;
  detail?: string;
}

const results: TestCase[] = [];

function record(
  id: string,
  section: string,
  name: string,
  pass: boolean,
  detail?: string,
) {
  results.push({ id, section, name, pass, detail });
  const mark = pass ? "✓" : "✗";
  console.log(`${mark} [${id}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function fetchJson(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<{ status: number; body: unknown }> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function login(email: string): Promise<string | null> {
  const account = DEMO_ACCOUNTS[email as keyof typeof DEMO_ACCOUNTS];
  if (!account) return null;

  const { status, body } = await fetchJson("/api/auth/email-login", {
    method: "POST",
    body: JSON.stringify({ email, password: account.password }),
  });

  const session = (body as { data?: { session?: { access_token?: string } } })
    .data?.session;
  if (status !== 200 || !session?.access_token) return null;
  return session.access_token;
}

async function runPrep() {
  const section = "1. Préparation";

  try {
    const health = await fetch(`${API_URL}/health`);
    record(
      "PREP-01",
      section,
      "API /health répond 200",
      health.ok,
      `status ${health.status}`,
    );
  } catch (err) {
    record("PREP-01", section, "API /health répond 200", false, String(err));
  }

  const demo = await fetchJson("/api/auth/demo-accounts");
  record(
    "PREP-02",
    section,
    "GET /api/auth/demo-accounts (dev login)",
    demo.status === 200,
    `status ${demo.status}`,
  );

  const campusRes = await fetchJson("/api/campus");
  const campuses = (campusRes.body as { data?: unknown[] })?.data ?? [];
  record(
    "PREP-03",
    section,
    "GET /api/campus liste campus",
    campusRes.status === 200 && campuses.length > 0,
    `${campuses.length} campus`,
  );
}

async function runStudentPublic(campusId: string) {
  const section = "3.1 Élève — Marketplace publique";

  const list = await fetchJson(
    `/api/public/campus/${campusId}/tutors`,
  );
  const tutors =
    (list.body as { data?: unknown[] })?.data ?? [];
  record(
    "E-PUB-01",
    section,
    "Liste tuteurs campus",
    list.status === 200,
    `${tutors.length} tuteur(s)`,
  );

  const bookable = await fetchJson(
    `/api/public/campus/${campusId}/tutors?bookable=true`,
  );
  const bookableList =
    (bookable.body as { data?: unknown[] })?.data ?? [];
  record(
    "E-PUB-02",
    section,
    "Filtre bookable=true",
    bookable.status === 200,
    `${bookableList.length} réservable(s)`,
  );

  if (tutors.length > 0) {
    const first = tutors[0] as { id: string };
    const detail = await fetchJson(
      `/api/public/campus/${campusId}/tutors/${first.id}`,
    );
    record(
      "E-PUB-03",
      section,
      "Fiche tuteur publique",
      detail.status === 200,
      first.id,
    );
  } else {
    record(
      "E-PUB-03",
      section,
      "Fiche tuteur publique",
      false,
      "aucun tuteur — lancer seed-five-profs",
    );
  }

  const stats = await fetchJson(`/api/public/campus/${campusId}/stats`);
  record(
    "E-PUB-04",
    section,
    "Stats campus publiques",
    stats.status === 200,
  );
}

async function runStudentAuth() {
  const section = "3.2 Élève — Auth";

  const token = await login("eleve.dupont@ensam.eu");
  record(
    "E-AUTH-01",
    section,
    "Login élève démo",
    token !== null,
  );

  if (!token) return null;

  const me = await fetchJson("/api/auth/me", { token });
  record(
    "E-AUTH-02",
    section,
    "GET /api/auth/me",
    me.status === 200,
  );

  const profile = await fetchJson("/api/profile/me", { token });
  const role = (profile.body as { data?: { role?: string } })?.data?.role;
  record(
    "E-AUTH-03",
    section,
    "Profil student_provider",
    profile.status === 200 && role === "student_provider",
    role,
  );

  return token;
}

async function runStudentApp(token: string, campusId: string) {
  const section = "3.4–3.9 Élève — Espace connecté";

  const schedule = await fetchJson("/api/schedule/me", { token });
  record("E-APP-01", section, "GET /api/schedule/me", schedule.status === 200);

  const notif = await fetchJson("/api/notifications", { token });
  record(
    "E-APP-02",
    section,
    "GET /api/notifications",
    notif.status === 200,
  );

  const repo = await fetchJson("/api/repository/folders", { token });
  record(
    "E-APP-03",
    section,
    "GET /api/repository/folders",
    repo.status === 200,
  );

  const tutors = await fetchJson(
    `/api/public/campus/${campusId}/tutors`,
    { token },
  );
  record(
    "E-BOOK-01",
    section,
    "Liste tuteurs (authentifié)",
    tutors.status === 200,
  );

  if (tutors.status === 200) {
    const first = (tutors.body as { data?: { id: string }[] })?.data?.[0];
    if (first) {
      const slots = await fetchJson(`/api/tutors/${first.id}/slots`, {
        token,
      });
      const slotList = (slots.body as { data?: unknown[] })?.data ?? [];
      record(
        "E-BOOK-02",
        section,
        "GET /api/tutors/:id/slots (élève)",
        slots.status === 200 && slotList.length > 0,
        `${slotList.length} créneau(x)`,
      );
    }
  }
}

async function runTeacher() {
  const section = "4. Prof — API";

  const personas: Array<{ email: string; id: string; check: string }> = [
    {
      email: "prof.martin@ensam.eu",
      id: "P-PROF-01",
      check: "active",
    },
    {
      email: "prof.enattente@ensam.eu",
      id: "P-PROF-02",
      check: "pending_siret",
    },
    {
      email: "prof.suspended@ensam.eu",
      id: "P-AUTH-01",
      check: "suspended",
    },
    {
      email: "prof.express@ensam.eu",
      id: "P-PROF-03",
      check: "pending_siret",
    },
  ];

  for (const { email, id, check } of personas) {
    const token = await login(email);
    if (!token) {
      record(id, section, `Login ${email}`, false);
      continue;
    }
    record(id, section, `Login ${email}`, true);

    const profile = await fetchJson("/api/profile/me", { token });
    const status = (profile.body as { data?: { account_status?: string } })
      ?.data?.account_status;
    record(
      `${id}-status`,
      section,
      `Statut ${email}`,
      status === check,
      status,
    );
  }

  const teacherToken = await login("prof.martin@ensam.eu");
  if (teacherToken) {
    const fiscal = await fetchJson("/api/fiscal/calculate/demo", {
      token: teacherToken,
    });
    record(
      "P-FISC-01",
      section,
      "GET /api/fiscal/calculate/demo",
      fiscal.status === 200,
    );

    const stripe = await fetchJson("/api/stripe/connect/status", {
      token: teacherToken,
    });
    record(
      "P-PAY-01",
      section,
      "GET /api/stripe/connect/status",
      stripe.status === 200,
    );
  }
}

async function runAdmin() {
  const section = "5. Admin RH — API";

  const studentToken = await login("eleve.dupont@ensam.eu");
  if (studentToken) {
    const denied = await fetchJson("/api/admin/me", { token: studentToken });
    record(
      "A-SEC-03",
      section,
      "Élève refusé sur /api/admin/me",
      denied.status === 403,
      `status ${denied.status}`,
    );
  }

  const rhToken = await login("jules.henri@ensam.eu");
  if (!rhToken) {
    record(
      "A-SEC-04",
      section,
      "Login RH",
      false,
      "promote-rh-admin requis",
    );
    return;
  }
  record("A-SEC-04", section, "Login RH", true);

  const me = await fetchJson("/api/admin/me", { token: rhToken });
  const role = (me.body as { data?: { role?: string } })?.data?.role;
  record(
    "A-SEC-05",
    section,
    "GET /api/admin/me admin_general",
    me.status === 200 && role === "admin_general",
    role,
  );

  const endpoints = [
    ["/api/admin/dashboard", "A-DASH-01", "Dashboard"],
    ["/api/admin/profiles", "A-USER-01", "Profils"],
    ["/api/admin/budgets", "A-BUDG-01", "Budgets"],
    ["/api/admin/transactions", "A-BUDG-02", "Transactions"],
    ["/api/admin/courses", "A-COURS-01", "Cours"],
    ["/api/admin/schedule", "A-PLAN-01", "Planning"],
    ["/api/admin/campuses", "A-CAMP-01", "Campuses"],
    ["/api/admin/invoices", "A-INV-01", "Factures"],
  ] as const;

  for (const [path, id, name] of endpoints) {
    const res = await fetchJson(path, { token: rhToken });
    record(id, section, `GET ${path} (${name})`, res.status === 200);
  }

  const pending = await fetchJson(
    "/api/admin/profiles?account_status=pending_siret",
    { token: rhToken },
  );
  const pendingList =
    (pending.body as { data?: unknown[] })?.data ?? [];
  record(
    "A-USER-02",
    section,
    "Preset pending_siret",
    pending.status === 200,
    `${pendingList.length} prof(s)`,
  );
}

async function runE2E(campusId: string) {
  const section = "6. Scénarios bout-en-bout (API)";

  const list = await fetchJson(
    `/api/public/campus/${campusId}/tutors?bookable=true`,
  );
  const tutors =
    (list.body as { data?: unknown[] })?.data ?? [];
  record(
    "E2E-01",
    section,
    "Profs réservables visibles marketplace",
    tutors.length > 0,
    `${tutors.length} prof(s)`,
  );

  const rhToken = await login("jules.henri@ensam.eu");
  const pending = rhToken
    ? await fetchJson("/api/admin/profiles?account_status=pending_siret", {
        token: rhToken,
      })
    : { status: 0, body: {} };
  const pendingCount =
    ((pending.body as { data?: unknown[] })?.data ?? []).length;
  record(
    "E2E-02",
    section,
    "Pipeline activation RH (profils pending)",
    pending.status === 200 && pendingCount > 0,
    `${pendingCount} en attente`,
  );

  const studentToken = await login("eleve.dupont@ensam.eu");
  if (studentToken) {
    const profile = await fetchJson("/api/profile/me", { token: studentToken });
    const studentCampus = (profile.body as { data?: { campus_id?: string } })
      ?.data?.campus_id;
    record(
      "E2E-03",
      section,
      "Élève et profs sur même campus (Aix)",
      studentCampus === campusId,
      studentCampus,
    );
  }
}

async function runEdge() {
  const section = "7. Cas limites";

  const badEmail = await fetchJson("/api/auth/email-login", {
    method: "POST",
    body: JSON.stringify({
      email: "hors-domaine@gmail.com",
      password: "test",
    }),
  });
  record(
    "EDGE-01",
    section,
    "Email hors @ensam.eu refusé",
    badEmail.status === 401 || badEmail.status === 400,
    `status ${badEmail.status}`,
  );

  const noAuth = await fetchJson("/api/admin/me");
  record(
    "EDGE-02",
    section,
    "/api/admin/me sans token → 401",
    noAuth.status === 401,
    `status ${noAuth.status}`,
  );

  const badCampus = await fetchJson(
    "/api/public/campus/00000000-0000-0000-0000-000000000099/tutors",
  );
  record(
    "EDGE-03",
    section,
    "Campus invalide → liste vide ou 404",
    badCampus.status === 200 || badCampus.status === 404,
    `status ${badCampus.status}`,
  );
}

async function runVercel() {
  const section = "8. Vercel / staging";

  if (!VERCEL_API_URL) {
    record(
      "V-01",
      section,
      "VERCEL_API_URL non défini — skip smoke staging",
      true,
      "définir VERCEL_API_URL pour tester",
    );
    return;
  }

  try {
    const res = await fetch(`${VERCEL_API_URL}/health`);
    record(
      "V-01",
      section,
      "GET /health Vercel",
      res.ok,
      `status ${res.status}`,
    );
  } catch (err) {
    record("V-01", section, "GET /health Vercel", false, String(err));
  }
}

function writeReport() {
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  const now = new Date().toISOString();

  const bySection = new Map<string, TestCase[]>();
  for (const r of results) {
    const list = bySection.get(r.section) ?? [];
    list.push(r);
    bySection.set(r.section, list);
  }

  let md = `# Rapport d'exécution — Plan de test Gadz'Connect\n\n`;
  md += `**Date :** ${now}\n`;
  md += `**API :** ${API_URL}\n`;
  md += `**Résultat :** ${passed} passés, ${failed} échoués sur ${results.length}\n\n`;

  for (const [section, cases] of bySection) {
    md += `## ${section}\n\n`;
    md += `| ID | Test | Résultat | Détail |\n`;
    md += `|----|------|----------|--------|\n`;
    for (const c of cases) {
      md += `| ${c.id} | ${c.name} | ${c.pass ? "PASS" : "FAIL"} | ${c.detail ?? ""} |\n`;
    }
    md += `\n`;
  }

  writeFileSync(REPORT_PATH, md);
  console.log(`\nRapport écrit : ${REPORT_PATH}`);
}

async function resolveCampusId(): Promise<string | null> {
  const res = await fetchJson("/api/campus");
  const campuses = (res.body as { data?: { id: string; name: string }[] })
    ?.data;
  const aix = campuses?.find((c) => c.name === "Aix");
  return aix?.id ?? campuses?.[0]?.id ?? null;
}

async function main() {
  console.log(`\n=== Plan de test plateforme — ${API_URL} ===\n`);

  await runPrep();

  const campusId = await resolveCampusId();
  if (!campusId) {
    record(
      "PREP-04",
      "1. Préparation",
      "Campus Aix résolu",
      false,
      "seed requis",
    );
  } else {
    record("PREP-04", "1. Préparation", "Campus Aix résolu", true, campusId);
    await runStudentPublic(campusId);
  }

  const studentToken = await runStudentAuth();
  if (studentToken && campusId) {
    await runStudentApp(studentToken, campusId);
  }

  await runTeacher();
  await runAdmin();
  if (campusId) await runE2E(campusId);
  await runEdge();
  await runVercel();

  writeReport();

  const failed = results.filter((r) => !r.pass).length;
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
