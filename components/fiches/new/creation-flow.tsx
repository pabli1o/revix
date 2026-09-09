"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { fetchJson, RequestFailedError } from "@/lib/fetch-json";
import type { CreateDraftResponse, FicheProposal } from "@/lib/fiches/types";
import { estimateBase64Bytes, MAX_TOTAL_PAYLOAD_BYTES } from "./file-utils";
import { FicheLoader } from "./fiche-loader";
import { SourcePicker, type PendingSource } from "./source-picker";
import { ProposalPreview } from "./proposal-preview";

interface ValidationItem {
  key: string;
  proposal: FicheProposal;
  selected: boolean;
  titre: string;
}

type Step = "sources" | "generating" | "validation" | "preparing";

export function CreationFlow({ isSubscribed }: { isSubscribed: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("sources");
  const [sources, setSources] = useState<PendingSource[]>([]);
  const [items, setItems] = useState<ValidationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);

    const totalBytes = sources.reduce(
      (sum, s) => sum + estimateBase64Bytes(s.data ?? "") + (s.texte?.length ?? 0),
      0,
    );
    if (totalBytes > MAX_TOTAL_PAYLOAD_BYTES) {
      setError(
        "Le contenu total dépasse ce que le serveur peut recevoir en une fois. Retire une ou plusieurs sources (photos surtout), ou répartis-les sur plusieurs fiches.",
      );
      return;
    }

    setStep("generating");
    try {
      const { status, data } = await fetchJson<{ proposals?: FicheProposal[]; error?: string }>(
        "/api/fiches/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sources: sources.map((s) => ({
              type: s.type,
              nom: s.nom,
              texte: s.texte,
              data: s.data,
              mediaType: s.mediaType,
            })),
          }),
        },
      );
      if (status < 200 || status >= 300 || !data?.proposals) {
        setError(data?.error ?? "La génération a échoué.");
        setStep("sources");
        return;
      }
      setItems(
        data.proposals.map((proposal, i) => ({
          key: `${i}-${proposal.titre}`,
          proposal,
          selected: true,
          titre: proposal.titre,
        })),
      );
      setStep("validation");
    } catch (err) {
      setError(err instanceof RequestFailedError ? err.message : "Erreur réseau pendant la génération.");
      setStep("sources");
    }
  }

  function updateItem(key: string, patch: Partial<ValidationItem>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  /**
   * "Enregistrer" no longer saves directly: matière/chapitre is chosen on
   * the next screen, once we know for sure the user has an active
   * subscription (required to save at all). The reviewed fiches are stored
   * as a draft first because a not-yet-subscribed user is about to leave
   * the site entirely for Stripe Checkout, and the in-memory selection
   * here wouldn't survive that round trip.
   */
  async function handleContinue() {
    setError(null);

    const toSave: FicheProposal[] = items
      .filter((it) => it.selected)
      .map((it) => ({ titre: it.titre, contenu: it.proposal.contenu }));

    if (toSave.length === 0) {
      setError("Sélectionne au moins une fiche à enregistrer.");
      return;
    }

    setStep("preparing");
    try {
      const draftRes = await fetchJson<CreateDraftResponse & { error?: string }>(
        "/api/fiches/drafts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: toSave,
            sources: sources.map((s) => ({ type: s.type, nom: s.nom })),
          }),
        },
      );
      if (draftRes.status < 200 || draftRes.status >= 300 || !draftRes.data?.draftId) {
        setError(draftRes.data?.error ?? "Impossible de préparer l'enregistrement.");
        setStep("validation");
        return;
      }
      const draftId = draftRes.data.draftId;

      if (isSubscribed) {
        router.push(`/fiches/new/assign?draft=${draftId}`);
        return;
      }

      const checkoutRes = await fetchJson<{ url?: string; error?: string }>(
        "/api/stripe/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draftId }),
        },
      );
      if (checkoutRes.status < 200 || checkoutRes.status >= 300 || !checkoutRes.data?.url) {
        setError(checkoutRes.data?.error ?? "Impossible d'ouvrir la page de paiement.");
        setStep("validation");
        return;
      }
      window.location.href = checkoutRes.data.url;
    } catch (err) {
      setError(err instanceof RequestFailedError ? err.message : "Erreur réseau.");
      setStep("validation");
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-3xl font-semibold">Nouvelle fiche</h1>

      {error && (
        <p className="mb-4 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      {step === "sources" && (
        <Card>
          <SourcePicker sources={sources} onChange={setSources} />
          <Button className="mt-6 w-full" disabled={sources.length === 0} onClick={handleGenerate}>
            Générer la fiche ✨
          </Button>
        </Card>
      )}

      {step === "generating" && (
        <Card>
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <FicheLoader />
            <p className="font-heading text-lg font-semibold">Génération de ta fiche…</p>
            <p className="max-w-sm text-sm text-text-muted">
              Lecture de tes sources et rédaction du plan — ça prend en général quelques
              dizaines de secondes.
            </p>
          </div>
        </Card>
      )}

      {(step === "validation" || step === "preparing") && (
        <div className="flex flex-col gap-5">
          {!isSubscribed && (
            <p className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
              Aperçu limité : abonne-toi pour lire et enregistrer tes fiches en entier.
            </p>
          )}
          {items.map((item) => (
            <Card key={item.key}>
              <div className="mb-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1.5 size-4 accent-[#E8A33D]"
                  checked={item.selected}
                  onChange={(e) => updateItem(item.key, { selected: e.target.checked })}
                />
                <Input
                  value={item.titre}
                  onChange={(e) => updateItem(item.key, { titre: e.target.value })}
                  className="flex-1"
                />
              </div>

              <ProposalPreview contenu={item.proposal.contenu} isSubscribed={isSubscribed} />
            </Card>
          ))}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep("sources")}>
              Retour
            </Button>
            <Button className="flex-1" onClick={handleContinue} disabled={step === "preparing"}>
              {step === "preparing" ? "Un instant…" : "Enregistrer la fiche"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
