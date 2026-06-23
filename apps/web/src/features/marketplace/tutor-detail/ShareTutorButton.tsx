import { Button } from "@gadz-connect/ui";
import { Send } from "lucide-react";
import { useState } from "react";

interface ShareTutorButtonProps {
  url: string;
  tutorName: string;
}

export function ShareTutorButton({ url, tutorName }: ShareTutorButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareData = {
      title: `${tutorName} — Gadz'Connect`,
      text: `Professeur sur Gadz'Connect : ${tutorName}`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // fallback copy
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void handleShare()}
    >
      <Send className="mr-1.5 h-4 w-4" />
      {copied ? "Lien copié" : "Partager"}
    </Button>
  );
}
