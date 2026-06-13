import { Button } from "@gadz-connect/ui";
import { useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { API_URL } from "@/lib/api";
import { INPI_URL } from "./guide/content";

async function downloadPdf(path: string, token: string, filename: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Téléchargement impossible");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function OnboardingDocumentsPanel() {
  const { getAccessToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"guide" | "acre" | null>(null);

  async function handleDownload(type: "guide" | "acre") {
    setError(null);
    const token = getAccessToken();
    if (!token) return;

    setLoading(type);
    try {
      await downloadPdf(
        `/api/onboarding/documents/${type}`,
        token,
        type === "guide"
          ? "gadzconnect-guide-inpi.pdf"
          : "gadzconnect-acre-recap.pdf",
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="rounded-md border border-brand-100 bg-brand-50/40 p-5 space-y-3">
      <div>
        <h3 className="font-semibold text-brand-700">
          Documents complémentaires (optionnel)
        </h3>
        <p className="mt-1 text-sm text-brand-700/80">
          Le parcours interactif ci-dessus remplace le PDF Méthodo. Vous pouvez
          toutefois télécharger votre récapitulatif personnalisé ou le dossier
          ACRE.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading !== null}
          onClick={() => void handleDownload("guide")}
        >
          {loading === "guide" ? "Génération…" : "Guide PDF complet (tuyss)"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading !== null}
          onClick={() => void handleDownload("acre")}
        >
          {loading === "acre" ? "Génération…" : "Récapitulatif ACRE"}
        </Button>
        <Button type="button" size="sm" variant="outline" asChild>
          <a href={INPI_URL} target="_blank" rel="noopener noreferrer">
            Guichet Unique INPI →
          </a>
        </Button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </section>
  );
}
