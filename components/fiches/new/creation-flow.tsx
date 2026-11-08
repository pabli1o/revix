"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FloatingBottomBar } from "@/components/layout/floating-bottom-bar";
import { fetchJson, RequestFailedError } from "@/lib/fetch-json";
import type { CreateDraftResponse, FicheProposal } from "@/lib/fiches/types";
import { chunkSources, estimateBase64Bytes, MAX_TOTAL_PAYLOAD_BYTES } from "./file-utils";
import type { GenerateSourceInput } from "@/lib/fiches/types";
import { FicheLoader } from "@/components/ui/fiche-loader";
import { ProgressBar } from "@/components/ui/progress-bar";
import { PricingModal } from "@/components/abonnement/pricing-modal";
import { SourcePicker, type PendingSource } from "./source-picker";
import { uploadSourceFile } from "./upload-source";
import { loadDraftSources, saveDraftSources, clearDraftSources } from "./local-draft";
import { markResumeFicheCreation } from "./resume-flag";
import { ProposalPreview } from "./proposal-preview";

interface ValidationItem {
  key: string;
  proposal: FicheProposal;
  selected: boolean;
  titre: string;
}

type Step = "sources" | "generating" | "validation" | "preparing";

// See the matching constant in assign-flow.tsx — this flow's "sources" and
// "validation" screens are steps 1 and 2 of 4; matière/chapitre (3 and 4)
// live in assign-flow.tsx after a full navigation away from here.
const CREATION_FLOW_TOTAL_STEPS = 4;

/** Thrown by submitChunk so a failed chunk's reason (including whether it
 * was an AI usage cap, or the one-time free trial already used) survives
 * Promise.allSettled as a rejection. */
class ChunkGenerationError extends Error {
  aiUsageCapExceeded?: boolean;
  freeTrialExhausted?: boolean;
  constructor(message: string, aiUsageCapExceeded?: boolean, freeTrialExhausted?: boolean) {
    super(message);
    this.aiUsageCapExceeded = aiUsageCapExceeded;
    this.freeTrialExhausted = freeTrialExhausted;
  }
}

// Matches the exact suffix FICHE_GENERATION_SYSTEM instructs the model to
// use (see lib/anthropic/prompts.ts): "<titre de base> — Partie <n>". A
// touch tolerant of dash style/case since it's reading model output, not
// validating it, but anchored to "Partie <digits>" at the very end so it
// never matches an unrelated title that happens to contain the ordinary
// French word "partie".
const PARTIE_SUFFIX_RE = /^(.*?)\s*[—-]\s*Partie\s+\d+\s*$/i;

function stripPartieSuffix(titre: string): string {
  const match = titre.match(PARTIE_SUFFIX_RE);
  return match ? match[1].trim() : titre.trim();
}

/** Shared wording for a source dropped because it came back empty/
 * unreadable from the browser's local storage (the confirmed Safari/
 * WebKit IndexedDB bug — see local-draft.ts) — used wherever that can
 * happen: loading a draft, saving one, or resolving an upload right
 * before generation. */
function droppedSourcesMessage(names: string[]): string {
  const list = names.map((n) => `« ${n} »`).join(", ");
  return names.length > 1
    ? `${list} n'ont pas pu être conservés (vides ou illisibles dans ce navigateur) — retire-les et rajoute-les.`
    : `${list} n'a pas pu être conservé (vide ou illisible dans ce navigateur) — retire-le et rajoute-le.`;
}

/**
 * A large PDF split into independent page-range chunks (see pdf-split.ts)
 * sends each range to Claude with no knowledge of the others. If a range
 * is itself long enough that the model decides to split it into "Partie
 * N" fiches (see FICHE_GENERATION_SYSTEM), that numbering restarts from 1
 * inside each range's own response — so two different ranges of the same
 * subject can each come back labeled "Partie 1".
 *
 * This renumbers fiches that share both the same split-PDF source
 * (groupId) and the same base title into one continuous sequence, in the
 * real order those chunks were submitted in (tagged's own order —
 * Promise.allSettled already preserves it regardless of which chunk
 * actually finished first, see handleGenerate below). Deliberately only
 * touches titles the model itself already suffixed with "— Partie N":
 * two standalone fiches that happen to share an identical title (e.g.
 * both titled "Exercices" in different chapters of the same PDF) are
 * never merged into a fake sequence just because the text matches —
 * only an actual local "Partie N" claim is ever renumbered. A lone
 * "Partie N" that ends up with no sibling anywhere in the document (the
 * model thought it needed splitting but no other chunk continues it)
 * has its suffix stripped instead, since a single part doesn't need
 * part-numbering.
 */
function renumberSplitPdfParts(
  tagged: { proposal: FicheProposal; groupId: string | null }[],
): FicheProposal[] {
  const groups = new Map<string, number[]>();
  tagged.forEach(({ proposal, groupId }, index) => {
    if (groupId === null || !PARTIE_SUFFIX_RE.test(proposal.titre)) return;
    const key = `${groupId}::${stripPartieSuffix(proposal.titre)}`;
    const indices = groups.get(key);
    if (indices) {
      indices.push(index);
    } else {
      groups.set(key, [index]);
    }
  });

  const retitled = new Map<number, string>();
  for (const indices of groups.values()) {
    const baseTitle = stripPartieSuffix(tagged[indices[0]].proposal.titre);
    indices.forEach((index, i) => {
      retitled.set(index, indices.length > 1 ? `${baseTitle} — Partie ${i + 1}` : baseTitle);
    });
  }

  return tagged.map(({ proposal }, index) => {
    const titre = retitled.get(index);
    return titre !== undefined ? { ...proposal, titre } : proposal;
  });
}

export function CreationFlow({
  isSubscribed,
  isAuthenticated = true,
  resumeFromDraft = false,
  initialFreeTrialExhausted = false,
}: {
  isSubscribed: boolean;
  /** False only for an anonymous visitor (the Fiches tab is reachable
   * without an account — see middleware.ts/app/(app)/layout.tsx; onboarding
   * happens first, locally, before any of this — app/onboarding/page.tsx).
   * Gates 2 things: clicking "Générer" opens /signup instead of calling the
   * API (the server would 401 it anyway — see /api/fiches/generate — this
   * is purely so the anonymous visitor gets a clear next step instead of a
   * failed request), and sources are persisted to/restored from IndexedDB
   * (local-draft.ts) so they survive the round trip through signup/login. */
  isAuthenticated?: boolean;
  /** True only on the one authenticated landing right after signup/login/
   * onboarding when an anonymous draft was pending (see app/(app)/fiches/
   * new/page.tsx's ?resume=1 and the 3 call sites that set it). Loads the
   * draft once on mount — the user still has to click "Générer" themselves
   * (no auto-generation: a fresh account's one free fiche shouldn't be
   * spent before they've even seen what they're about to generate). */
  resumeFromDraft?: boolean;
  /** Known upfront from the server for an authenticated non-subscriber
   * (see app/(app)/fiches/new/page.tsx) — lets the "fiche d'essai déjà
   * utilisée" message show immediately instead of only after a pointless
   * round trip that the server would reject anyway. */
  initialFreeTrialExhausted?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("sources");
  const [sources, setSources] = useState<PendingSource[]>([]);
  const [items, setItems] = useState<ValidationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricingDraftId, setPricingDraftId] = useState<string | null>(null);
  const [freeTrialExhausted, setFreeTrialExhausted] = useState(initialFreeTrialExhausted);
  const [generationProgress, setGenerationProgress] = useState<{ done: number; total: number } | null>(
    null,
  );

  // Anonymous visitor: restore whatever was typed/added before (e.g. they
  // navigated back from /signup without finishing). Resumed-after-auth
  // visitor: load the pending draft once so it's there to review and
  // click "Générer" on — no state is carried over through the full-page
  // redirect chain (signup/login → maybe /onboarding → here), so
  // IndexedDB is the only thing bridging it. Either way, a missing/
  // unreadable draft is a clear message, never a crash — see
  // local-draft.ts's doc comment.
  useEffect(() => {
    if (resumeFromDraft) {
      loadDraftSources()
        .then((result) => {
          if (!result || result.sources.length === 0) {
            console.error("[creation-flow] resumeFromDraft: loadDraftSources() returned no usable source", result);
            setError(
              result && result.dropped.length > 0
                ? droppedSourcesMessage(result.dropped.map((d) => d.nom))
                : "Ton brouillon n'a pas été retrouvé sur cet appareil — ajoute à nouveau ton cours.",
            );
            return;
          }
          setSources(result.sources);
          if (result.dropped.length > 0) {
            setError(droppedSourcesMessage(result.dropped.map((d) => d.nom)));
          }
          clearDraftSources().catch((err) => {
            console.error("[creation-flow] clearDraftSources() failed after resume:", err);
          });
        })
        .catch((err) => {
          console.error("[creation-flow] resumeFromDraft: loadDraftSources() threw:", err);
          setError(
            "Ton brouillon n'a pas été retrouvé sur cet appareil — ajoute à nouveau ton cours.",
          );
        });
      return;
    }
    if (!isAuthenticated) {
      loadDraftSources()
        .then((result) => {
          if (!result) return;
          if (result.sources.length > 0) setSources(result.sources);
          if (result.dropped.length > 0) setError(droppedSourcesMessage(result.dropped.map((d) => d.nom)));
        })
        .catch((err) => {
          console.error("[creation-flow] anonymous loadDraftSources() threw:", err);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Wraps setSources so an anonymous visitor's draft is persisted on
   * every change — never for an authenticated user (no IndexedDB writes
   * at all for the normal, unchanged logged-in flow). A write failure
   * (quota, private browsing) surfaces as a clear message but keeps the
   * in-memory sources exactly as they are — nothing is lost from the
   * screen, only the "survives a redirect" guarantee is what's at risk. */
  function updateSources(next: PendingSource[]) {
    setSources(next);
    if (!isAuthenticated) {
      saveDraftSources(next)
        .then(({ dropped }) => {
          if (dropped.length === 0) return;
          // Dropped at the storage layer itself (failed the immediate
          // read-back check — see local-draft.ts) — reflect that in the
          // visible list too, instead of leaving a source on screen that
          // silently won't survive the trip through signup.
          const droppedIds = new Set(dropped.map((d) => d.id));
          setSources((prev) => prev.filter((s) => !droppedIds.has(s.id)));
          setError(droppedSourcesMessage(dropped.map((d) => d.nom)));
        })
        .catch((err) => {
          console.error("[creation-flow] updateSources: saveDraftSources() failed:", err);
          setError(
            "Ton brouillon ne peut pas être conservé dans ce navigateur (stockage plein ou bloqué) — connecte-toi avant d'ajouter d'autres fichiers, au risque de les perdre en changeant de page.",
          );
        });
    }
  }

  /** Anonymous visitor only: a PDF/Word source picked before signing in
   * carries a raw File (see source-picker.tsx's deferUpload) instead of a
   * storagePath, because uploadSourceFile() needs an authenticated
   * session. Resolved for real right here, now that one exists.
   *
   * Settled individually (not Promise.all, which would fail the whole
   * batch over one bad file) so one corrupted source — the exact "ajoute
   * un cours → inscription → retour → Générer → échec" bug report this
   * guards against — doesn't block everything else the visitor added:
   * texte and any other working file still go through, and the broken
   * one is named explicitly in `failures` instead of silently vanishing. */
  async function resolvePendingUploads(
    list: PendingSource[],
  ): Promise<{ resolved: PendingSource[]; failures: { id: string; nom: string; message: string }[] }> {
    const settled = await Promise.allSettled(
      list.map(async (s): Promise<PendingSource> => {
        if (s.file) {
          const storagePath = await uploadSourceFile(s.file);
          return { ...s, storagePath, file: undefined };
        }
        if (s.files && s.files.length > 0) {
          const storagePaths = await Promise.all(s.files.map((f) => uploadSourceFile(f)));
          return { ...s, storagePaths, files: undefined };
        }
        return s;
      }),
    );

    const resolved: PendingSource[] = [];
    const failures: { id: string; nom: string; message: string }[] = [];
    settled.forEach((r, i) => {
      if (r.status === "fulfilled") {
        resolved.push(r.value);
        return;
      }
      const message = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.error(`[creation-flow] resolvePendingUploads failed for "${list[i].nom}":`, r.reason);
      failures.push({ id: list[i].id, nom: list[i].nom, message });
    });

    return { resolved, failures };
  }

  async function submitChunk(chunk: GenerateSourceInput[]): Promise<FicheProposal[]> {
    const { status, data } = await fetchJson<{
      proposals?: FicheProposal[];
      error?: string;
      aiUsageCapExceeded?: boolean;
      freeTrialExhausted?: boolean;
    }>("/api/fiches/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sources: chunk }),
    });
    if (status < 200 || status >= 300 || !data?.proposals) {
      throw new ChunkGenerationError(
        data?.error ?? "La génération a échoué.",
        data?.aiUsageCapExceeded,
        data?.freeTrialExhausted,
      );
    }
    return data.proposals;
  }

  /**
   * Sends one /api/fiches/generate request per chunk, all at once
   * (Promise.allSettled) instead of one after another — each individual
   * call still stays comfortably inside Vercel's 60s function duration
   * regardless of how much the user uploaded in total (chunkSources keeps
   * every call's content small, and a large PDF is already split into
   * independent page-range sub-sources before it ever gets here — see
   * file-utils.ts and pdf-split.ts), but running them in parallel means
   * the total wait is roughly the slowest single chunk instead of the sum
   * of all of them. Promise.allSettled (rather than Promise.all) so every
   * chunk's outcome is collected even if one fails early — and so results
   * can be reassembled in the original chunk order regardless of which
   * one actually finished first.
   */
  async function handleGenerate() {
    setError(null);
    setFreeTrialExhausted(false);

    const { resolved: resolvedSources, failures } = await resolvePendingUploads(sources);
    if (failures.length > 0) {
      // Drop exactly the sources that failed from the visible list and
      // say so, but keep going with whatever did resolve: one bad PDF
      // shouldn't also take down the texte/photos that were fine.
      const failedIds = new Set(failures.map((f) => f.id));
      setSources((prev) => prev.filter((s) => !failedIds.has(s.id)));
      setError(failures.map((f) => `« ${f.nom} » : ${f.message}`).join(" "));
      if (resolvedSources.length === 0) {
        return;
      }
    }

    const totalBytes = resolvedSources.reduce(
      (sum, s) => sum + estimateBase64Bytes(s.data ?? "") + (s.texte?.length ?? 0),
      0,
    );
    if (totalBytes > MAX_TOTAL_PAYLOAD_BYTES) {
      setError(
        "Le contenu total dépasse ce que le serveur peut recevoir en une fois. Retire une ou plusieurs sources (photos surtout), ou répartis-les sur plusieurs fiches.",
      );
      return;
    }

    // A split PDF (see pdf-split.ts) carries several storage paths instead
    // of one — expand it into one independent GenerateSourceInput per
    // part here, right before chunking, so each part becomes its own
    // chunk/request below. Each part's storagePath is recorded against
    // the original source's id, so the resulting chunks can later be
    // traced back to "which split PDF did this come from" for
    // renumberSplitPdfParts below — GenerateSourceInput itself (the wire
    // type the server reads) carries nothing extra for this; it's tracked
    // purely client-side.
    const splitPdfGroupByPath = new Map<string, string>();
    const payloadSources: GenerateSourceInput[] = resolvedSources.flatMap((s): GenerateSourceInput[] => {
      if (s.storagePaths && s.storagePaths.length > 0) {
        return s.storagePaths.map((storagePath, i) => {
          splitPdfGroupByPath.set(storagePath, s.id);
          return {
            type: s.type,
            nom: `${s.nom} (partie ${i + 1}/${s.storagePaths!.length})`,
            storagePath,
          };
        });
      }
      return [
        {
          type: s.type,
          nom: s.nom,
          texte: s.texte,
          data: s.data,
          mediaType: s.mediaType,
          storagePath: s.storagePath,
        },
      ];
    });
    const chunks = chunkSources(payloadSources);
    // chunkSources always isolates a pdf/word source into its own
    // single-source chunk, so a chunk belongs to a split-PDF group iff
    // it has exactly one source and that source's storagePath was
    // recorded above.
    const chunkGroupIds: (string | null)[] = chunks.map((chunk) => {
      const storagePath = chunk.length === 1 ? chunk[0].storagePath : undefined;
      return (storagePath && splitPdfGroupByPath.get(storagePath)) || null;
    });

    setStep("generating");
    setGenerationProgress({ done: 0, total: chunks.length });
    try {
      const settled = await Promise.allSettled(
        chunks.map((chunk) =>
          submitChunk(chunk).then((proposals) => {
            setGenerationProgress((prev) => (prev ? { done: prev.done + 1, total: prev.total } : prev));
            return proposals;
          }),
        ),
      );

      const failure = settled.find(
        (r): r is PromiseRejectedResult => r.status === "rejected",
      );
      if (failure) {
        const reason = failure.reason;
        console.error("[creation-flow] handleGenerate: a chunk request failed:", reason);
        if (reason instanceof ChunkGenerationError && reason.aiUsageCapExceeded) {
          router.push("/limite");
          return;
        }
        if (reason instanceof ChunkGenerationError && reason.freeTrialExhausted) {
          setFreeTrialExhausted(true);
          setStep("sources");
          return;
        }
        setError(reason instanceof Error ? reason.message : "La génération a échoué.");
        setStep("sources");
        return;
      }

      const fulfilled = settled as PromiseFulfilledResult<FicheProposal[]>[];
      const tagged = fulfilled.flatMap((r, i) =>
        r.value.map((proposal) => ({ proposal, groupId: chunkGroupIds[i] })),
      );
      const allProposals = renumberSplitPdfParts(tagged);
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
      // Reached only if something other than a chunk's own HTTP request
      // threw — e.g. renumberSplitPdfParts()/the proposal mapping below
      // choking on an unexpected shape. Logged with the raw error since
      // "Erreur réseau" would be misleading for a non-network failure.
      console.error("[creation-flow] handleGenerate: unexpected failure after chunks settled:", err);
      setError(err instanceof RequestFailedError ? err.message : "Une erreur inattendue est survenue pendant la génération.");
      setStep("sources");
    } finally {
      setGenerationProgress(null);
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

  /** The button's actual onClick for an anonymous visitor: never calls
   * handleGenerate() directly (the server would 401 it anyway — see
   * /api/fiches/generate — this is about UX, not the security boundary,
   * which is already enforced server-side). Persists the draft first and
   * only navigates to /signup if that succeeds, so a storage failure
   * doesn't silently strand the user's work mid-redirect. */
  async function handleGenerateClick() {
    if (!isAuthenticated) {
      setError(null);
      let dropped: { id: string; nom: string }[];
      try {
        ({ dropped } = await saveDraftSources(sources));
      } catch (err) {
        console.error("[creation-flow] handleGenerateClick: saveDraftSources() failed:", err);
        setError(
          "Impossible d'enregistrer ton brouillon dans ce navigateur (stockage plein ou bloqué). Réessaie avec moins de fichiers, ou connecte-toi d'abord.",
        );
        return;
      }

      const remaining =
        dropped.length > 0
          ? sources.filter((s) => !dropped.some((d) => d.id === s.id))
          : sources;
      if (dropped.length > 0) {
        setSources(remaining);
        setError(droppedSourcesMessage(dropped.map((d) => d.nom)));
      }
      if (remaining.length === 0) {
        // Nothing left to generate — don't send the visitor to signup
        // over an empty draft; let them re-add the dropped file(s) first.
        return;
      }

      markResumeFicheCreation();
      router.push("/signup?intent=fiche");
      return;
    }
    await handleGenerate();
  }

  return (
    <div className={clsx(isReviewing && "pb-24")}>
      <ProgressBar step={isReviewing ? 2 : 1} total={CREATION_FLOW_TOTAL_STEPS} />

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
          prefetch={true}
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
        freeTrialExhausted ? (
          <Card className="flex flex-col items-center gap-4 p-8 text-center">
            <span className="text-4xl" aria-hidden>
              🔒
            </span>
            <div>
              <p className="font-heading text-lg font-semibold">Tu as déjà généré ta fiche d&apos;essai.</p>
              <p className="mt-1 text-text-muted">
                Abonne-toi pour continuer à créer des fiches.
              </p>
            </div>
            <Button size="lg" onClick={() => setPricingOpen(true)}>
              Voir les abonnements
            </Button>
          </Card>
        ) : (
          <Card>
            <SourcePicker sources={sources} onChange={updateSources} deferUpload={!isAuthenticated} />
            <Button className="mt-6 w-full" disabled={sources.length === 0} onClick={handleGenerateClick}>
              Générer la fiche ✨
            </Button>
          </Card>
        )
      )}

      {step === "generating" && (
        <Card>
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <FicheLoader />
            <p className="font-heading text-lg font-semibold">Tes fiches prennent forme…</p>
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
