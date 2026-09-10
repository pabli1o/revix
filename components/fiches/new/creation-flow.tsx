"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { fetchJson, RequestFailedError } from "@/lib/fetch-json";
import type { CreateDraftResponse, FicheProposal } from "@/lib/fiches/types";
import { estimateBase64Bytes, MAX_TOTAL_PAYLOAD_BYTES } from "./file-utils";
import { FicheLoader } from "@/components/ui/fiche-loader";
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
  const [subscribing, setSubscribing] = useState(false);

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
              storagePath: s.storagePath,
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

  function selectedProposals(): FicheProposal[] | null {
    const toSave: FicheProposal[] = items
      .filter((it) => it.selected)
      .map((it) => ({ titre: it.titre, contenu: it.proposal.contenu }));
    if (toSave.length === 0) {
      setError("Sélectionne au moins une fiche à enregistrer.");
      return null;
    }
    return toSave;
  }

  /** Stores the reviewed fiches server-side so they survive a full
   * navigation away (to the assign step, or further out to Stripe
   * Checkout) — the in-memory selection here can't. */
  async function createDraft(toSave: FicheProposal[]): Promise<string | null> {
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
      return null;
    }
    return draftRes.data.draftId;
  }

  /** Only reachable when isSubscribed (see render below) — a
   * non-subscriber never sees this step at all, only the offer screen. */
  async function handleContinue() {
    setError(null);
    const toSave = selectedProposals();
    if (!toSave) return;

    setStep("preparing");
    try {
      const draftId = await createDraft(toSave);
      if (!draftId) {
        setStep("validation");
        return;
      }
      router.push(`/fiches/new/assign?draft=${draftId}`);
    } catch (err) {
      setError(err instanceof RequestFailedError ? err.message : "Erreur réseau.");
      setStep("validation");
    }
  }

  /** Only this click ever leaves the site for Stripe. */
  async function handleSubscribeFromOffer() {
    setError(null);
    const toSave = selectedProposals();
    if (!toSave) return;

    setSubscribing(true);
    try {
      const draftId = await createDraft(toSave);
      if (!draftId) {
        setSubscribing(false);
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
        setSubscribing(false);
        return;
      }
      window.location.href = checkoutRes.data.url;
    } catch (err) {
      setError(err instanceof RequestFailedError ? err.message : "Erreur réseau.");
      setSubscribing(false);
    }
  }

  const isReviewing = (step === "validation" || step === "preparing") && items.length > 0;

  return (
    <div className={clsx(isReviewing && "pb-24")}>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
            Nouvelle fiche
          </p>
          {isReviewing && (
            <p className="mt-1 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
              {items.length} fiche{items.length > 1 ? "s" : ""} proposée{items.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Link
          href="/fiches"
          aria-label="Fermer"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-bg-elevated text-text-muted transition-colors hover:border-accent hover:text-accent"
        >
          ✕
        </Link>
      </div>

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
          <div className="flex items-center justify-center py-16">
            <FicheLoader />
          </div>
        </Card>
      )}

      {/* Whether or not the user is subscribed, the fiche content itself is
          always shown — ProposalPreview blurs it progressively past the
          free preview when !isSubscribed. The only thing that changes with
          subscription status is the bottom call to action. */}
      {isReviewing && (
        <div className="flex flex-col gap-8">
          {items.map((item) => (
            <div key={item.key} className="mx-auto flex w-full max-w-xl flex-col gap-3">
              <div className="flex items-center gap-3">
                <Input
                  value={item.titre}
                  onChange={(e) => updateItem(item.key, { titre: e.target.value })}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => updateItem(item.key, { selected: !item.selected })}
                  className="flex shrink-0 items-center gap-1.5"
                >
                  <span
                    className={clsx(
                      "flex size-5 items-center justify-center rounded-full border-2 text-[10px] text-white transition-colors",
                      item.selected ? "border-accent bg-accent" : "border-border bg-transparent",
                    )}
                  >
                    {item.selected && "✓"}
                  </span>
                  <span className="text-sm text-text-muted">garder</span>
                </button>
              </div>

              <ProposalPreview contenu={item.proposal.contenu} isSubscribed={isSubscribed} />
            </div>
          ))}

          <div className="mx-auto flex w-full max-w-xl gap-3">
            <Button variant="secondary" onClick={() => setStep("sources")} disabled={subscribing}>
              Retour
            </Button>
            {isSubscribed ? (
              <Button className="flex-1" onClick={handleContinue} disabled={step === "preparing"}>
                {step === "preparing" ? "Un instant…" : "Enregistrer les fiches"}
              </Button>
            ) : (
              <Button className="flex-1" onClick={handleSubscribeFromOffer} disabled={subscribing}>
                {subscribing ? "Redirection…" : "Débloquer — 9,99 €/mois"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
