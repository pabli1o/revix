"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FloatingBottomBar } from "@/components/layout/floating-bottom-bar";
import { fetchJson, RequestFailedError } from "@/lib/fetch-json";
import type {
  CreateDraftResponse,
  FicheGenerationJobStatusResponse,
  FicheProposal,
} from "@/lib/fiches/types";
import { chunkSources, estimateBase64Bytes, MAX_TOTAL_PAYLOAD_BYTES } from "./file-utils";
import type { GenerateSourceInput } from "@/lib/fiches/types";
import { FicheLoader } from "@/components/ui/fiche-loader";
import { PricingModal } from "@/components/abonnement/pricing-modal";
import { SourcePicker, type PendingSource } from "./source-picker";
import { ProposalPreview } from "./proposal-preview";

interface ValidationItem {
  key: string;
  proposal: FicheProposal;
  selected: boolean;
  titre: string;
}

type Step = "sources" | "waiting" | "validation" | "preparing";

/** Generation now runs as an Anthropic Message Batch (no hard deadline —
 * see lib/anthropic/client.ts), so polling just keeps checking at a fixed
 * pace for as long as the component stays mounted instead of racing a
 * short timeout. */
const JOB_POLL_INTERVAL_MS = 4000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function CreationFlow({ isSubscribed }: { isSubscribed: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("sources");
  const [sources, setSources] = useState<PendingSource[]>([]);
  const [items, setItems] = useState<ValidationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricingDraftId, setPricingDraftId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<{ done: number; total: number } | null>(
    null,
  );

  // Set once the component unmounts (e.g. the user closes the flow while a
  // batch is still pending) so the polling loop below stops touching state
  // on a component that's gone, and stops making pointless network calls.
  const cancelledRef = useRef(false);
  useEffect(
    () => () => {
      cancelledRef.current = true;
    },
    [],
  );

  /**
   * Polls every submitted job until each is 'ready' or 'failed', with no
   * overall deadline — a batch can legitimately take a while, and there's
   * no longer a synchronous request to time out (see
   * lib/anthropic/client.ts's submitBatch/checkBatch). Returns the
   * proposals in the same order as `jobIds` (chunk order), or null if any
   * job failed (error/step state is already set before returning null).
   */
  async function pollJobs(jobIds: string[]): Promise<FicheProposal[][] | null> {
    const results: (FicheProposal[] | null)[] = jobIds.map(() => null);

    while (results.some((r) => r === null)) {
      if (cancelledRef.current) return null;
      await sleep(JOB_POLL_INTERVAL_MS);
      if (cancelledRef.current) return null;

      for (let i = 0; i < jobIds.length; i++) {
        if (results[i] !== null) continue;

        const { status, data } = await fetchJson<FicheGenerationJobStatusResponse>(
          `/api/fiches/generate/${jobIds[i]}`,
        );
        if (cancelledRef.current) return null;

        if (status < 200 || status >= 300 || !data) {
          setError("Impossible de vérifier l'état de la génération.");
          setStep("sources");
          return null;
        }
        if (data.status === "ready") {
          results[i] = data.proposals ?? [];
          setGenerationProgress((prev) => (prev ? { done: prev.done + 1, total: prev.total } : prev));
        } else if (data.status === "failed") {
          setError(data.error ?? "La génération a échoué.");
          setStep("sources");
          return null;
        }
      }
    }

    return results as FicheProposal[][];
  }

  /**
   * Sends one /api/fiches/generate submission per chunk instead of one
   * request for every source at once — chunkSources keeps each
   * submission's content small enough to stay under Vercel's request body
   * ceiling regardless of how much the user uploaded in total (see
   * file-utils.ts for exactly how sources are grouped, and its documented
   * residual limit: a single very large PDF/Word isn't split further).
   * Each submission returns a job id almost immediately; the actual
   * generation then runs as an Anthropic Message Batch and is tracked by
   * polling (see pollJobs above) while the "waiting" step is shown.
   */
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

    const payloadSources: GenerateSourceInput[] = sources.map((s) => ({
      type: s.type,
      nom: s.nom,
      texte: s.texte,
      data: s.data,
      mediaType: s.mediaType,
      storagePath: s.storagePath,
    }));
    const chunks = chunkSources(payloadSources);

    setStep("waiting");
    setGenerationProgress({ done: 0, total: chunks.length });
    try {
      const jobIds: string[] = [];
      for (const chunk of chunks) {
        const { status, data } = await fetchJson<{
          jobId?: string;
          error?: string;
          aiUsageCapExceeded?: boolean;
        }>("/api/fiches/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sources: chunk }),
        });
        if (status < 200 || status >= 300 || !data?.jobId) {
          if (data?.aiUsageCapExceeded) {
            router.push("/limite");
            return;
          }
          setError(data?.error ?? "La génération a échoué.");
          setStep("sources");
          return;
        }
        jobIds.push(data.jobId);
      }

      const perChunkProposals = await pollJobs(jobIds);
      if (!perChunkProposals) return;

      const allProposals = perChunkProposals.flat();
      setItems(
        allProposals.map((proposal, i) => ({
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
    } finally {
      if (!cancelledRef.current) setGenerationProgress(null);
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
   * navigation away (to the assign step, or further out to Whop
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

  /** Prepares the draft (so it survives the trip out to Whop Checkout) and
   * only then opens the pricing popup — the popup itself starts the actual
   * checkout once a tier is picked (see PricingCards, given this draftId). */
  async function handleOpenPricing() {
    setError(null);
    const toSave = selectedProposals();
    if (!toSave) return;

    setSubscribing(true);
    try {
      const draftId = await createDraft(toSave);
      if (!draftId) return;
      setPricingDraftId(draftId);
      setPricingOpen(true);
    } catch (err) {
      setError(err instanceof RequestFailedError ? err.message : "Erreur réseau.");
    } finally {
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

      {step === "waiting" && (
        <Card>
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <FicheLoader />
            <p className="font-heading text-lg font-semibold">Ta fiche est en cours de préparation</p>
            <p className="max-w-sm text-sm text-text-muted">
              Reviens dans quelques instants : elle apparaîtra automatiquement ici une fois prête.
            </p>
            {generationProgress && generationProgress.total > 1 && (
              <p className="font-mono text-sm text-text-muted">
                {generationProgress.done} / {generationProgress.total} prêtes
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Whether or not the user is subscribed, the fiche content itself is
          always shown — ProposalPreview blurs it past the free preview when
          !isSubscribed, with its own "Débloquer la fiche complète" layered
          on the blur. The subscribed CTA below is the only thing that
          changes with subscription status. */}
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

              <ProposalPreview
                contenu={item.proposal.contenu}
                isSubscribed={isSubscribed}
                onUnlock={handleOpenPricing}
                unlocking={subscribing}
              />
            </div>
          ))}

          <div className="mx-auto w-full max-w-xl">
            <button
              type="button"
              onClick={() => setStep("sources")}
              disabled={subscribing}
              className="text-sm text-text-muted hover:text-accent disabled:opacity-50"
            >
              ← Retour
            </button>
          </div>
        </div>
      )}

      {/* Only the subscribed CTA lives here — the unlock CTA for a
          non-subscriber is layered directly on each ProposalPreview's
          blurred region instead (see onUnlock above), so it stays right
          next to the content it unlocks rather than at the bottom of a
          possibly long, multi-fiche review screen. */}
      {isReviewing && isSubscribed && (
        <FloatingBottomBar>
          <Button className="w-full" onClick={handleContinue} disabled={step === "preparing"}>
            {step === "preparing" ? "Un instant…" : "Enregistrer les fiches"}
          </Button>
        </FloatingBottomBar>
      )}

      <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        draftId={pricingDraftId ?? undefined}
      />
    </div>
  );
}
