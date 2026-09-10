"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { fetchJson, RequestFailedError } from "@/lib/fetch-json";
import { assignSubjectColors } from "@/lib/theme/subject-colors";
import { FicheLoader } from "@/components/ui/fiche-loader";
import { ProposalPreview } from "./proposal-preview";
import type { FicheDraftResponse, SaveFichesResponse } from "@/lib/fiches/types";

interface SubjectOption {
  id: string;
  nom: string;
}
interface ChapterOption {
  id: string;
  nom: string;
  subject_id: string;
}

interface AssignItem {
  key: string;
  titre: string;
  contenu: FicheDraftResponse["items"][number]["contenu"];
}

interface Destination {
  subjectId?: string;
  newSubjectNom?: string;
  chapterId?: string;
  newChapterNom?: string;
}

const POLL_INTERVAL_MS = 1500;
const MAX_POLLS = 8;

type Phase =
  | "checking-subscription"
  | "waiting-subscription"
  | "subscription-timeout"
  | "not-subscribed"
  | "checkout-cancelled"
  | "loading-draft"
  | "draft-error"
  | "reviewing"
  | "picking-subject"
  | "picking-chapter"
  | "saving"
  | "done";

export function AssignFlow({
  draftId,
  checkoutStatus,
  subjects,
  chapters,
  initialIsSubscribed,
}: {
  draftId: string;
  checkoutStatus: "success" | "cancel" | null;
  subjects: SubjectOption[];
  chapters: ChapterOption[];
  initialIsSubscribed: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(
    !draftId
      ? "draft-error"
      : initialIsSubscribed
        ? "loading-draft"
        : checkoutStatus === "cancel"
          ? "checkout-cancelled"
          : checkoutStatus === "success"
            ? "checking-subscription"
            : "not-subscribed",
  );
  const [items, setItems] = useState<AssignItem[]>([]);
  const [sources, setSources] = useState<{ type: string; nom: string }[]>([]);
  const [destination, setDestination] = useState<Destination>({});
  const [newSubjectDraft, setNewSubjectDraft] = useState("");
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [newChapterDraft, setNewChapterDraft] = useState("");
  const [creatingChapter, setCreatingChapter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const pollCount = useRef(0);

  const subjectColors = assignSubjectColors(subjects.map((s) => s.nom));
  const chosenSubject = subjects.find((s) => s.id === destination.subjectId);
  const chapterOptions = destination.subjectId
    ? chapters.filter((c) => c.subject_id === destination.subjectId)
    : [];

  // Poll /api/me until the subscription webhook has landed (it can arrive
  // slightly after Stripe redirects the browser back here). Deliberately
  // NOT keyed on `phase`: this loop itself calls setPhase("waiting-
  // subscription") on every tick, and phase is also this effect's guard —
  // using it as a dependency would tear the effect down (and, critically,
  // clear the just-scheduled retry timeout) on every single tick, so
  // polling would stop after the very first check instead of continuing.
  // draftId/checkoutStatus/initialIsSubscribed are fixed for the life of
  // this component (a full navigation is needed to change them), so
  // running this once on mount is correct.
  useEffect(() => {
    if (!draftId || checkoutStatus !== "success" || initialIsSubscribed) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      const { data } = await fetchJson<{ subscription?: { isActive: boolean } }>("/api/me").catch(
        () => ({ status: 0, data: null }),
      );
      if (cancelled) return;
      if (data?.subscription?.isActive) {
        setPhase("loading-draft");
        return;
      }
      pollCount.current += 1;
      if (pollCount.current >= MAX_POLLS) {
        setPhase("subscription-timeout");
        return;
      }
      setPhase("waiting-subscription");
      timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [draftId, checkoutStatus, initialIsSubscribed, retryTick]);

  useEffect(() => {
    if (phase !== "loading-draft") return;
    let cancelled = false;

    fetchJson<FicheDraftResponse & { error?: string }>(`/api/fiches/drafts/${draftId}`)
      .then(({ status, data }) => {
        if (cancelled) return;
        if (status < 200 || status >= 300 || !data) {
          setError(data?.error ?? "Brouillon introuvable ou expiré.");
          setPhase("draft-error");
          return;
        }
        setItems(
          data.items.map((it, i) => ({ key: `${i}-${it.titre}`, titre: it.titre, contenu: it.contenu })),
        );
        setSources(data.sources);
        // A user who was already subscribed reviewed the fiche on the
        // previous screen already — go straight to matière. A user who
        // just subscribed via Stripe never saw it (creation-flow shows
        // the subscription offer instead of the fiche to a non-
        // subscriber), so show it here first.
        setPhase(checkoutStatus === "success" ? "reviewing" : "picking-subject");
      })
      .catch(() => {
        if (!cancelled) {
          setError("Impossible de charger le brouillon.");
          setPhase("draft-error");
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, draftId]);

  function updateItem(key: string, patch: Partial<AssignItem>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  async function startCheckout() {
    setCheckoutLoading(true);
    setError(null);
    try {
      const { status, data } = await fetchJson<{ url?: string; error?: string }>(
        "/api/stripe/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draftId }),
        },
      );
      if (status < 200 || status >= 300 || !data?.url) {
        setError(data?.error ?? "Impossible d'ouvrir la page de paiement.");
        setCheckoutLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof RequestFailedError ? err.message : "Erreur réseau.");
      setCheckoutLoading(false);
    }
  }

  function chooseExistingSubject(subjectId: string) {
    setDestination({ subjectId });
    setCreatingChapter(false);
    setNewChapterDraft("");
    setPhase("picking-chapter");
  }

  function confirmNewSubject() {
    const nom = newSubjectDraft.trim();
    if (!nom) return;
    setDestination({ newSubjectNom: nom });
    setCreatingChapter(false);
    setNewChapterDraft("");
    setPhase("picking-chapter");
  }

  function chooseExistingChapter(chapterId: string) {
    setDestination((d) => ({ ...d, chapterId, newChapterNom: undefined }));
    setCreatingChapter(false);
  }

  function confirmNewChapter() {
    const nom = newChapterDraft.trim();
    if (!nom) return;
    setDestination((d) => ({ ...d, chapterId: undefined, newChapterNom: nom }));
  }

  async function handleSave() {
    setError(null);
    setPhase("saving");

    const toSave = items.map((it) => ({
      titre: it.titre,
      contenu: it.contenu,
      sources,
      subjectId: destination.subjectId,
      newSubjectNom: destination.newSubjectNom,
      chapterId: destination.chapterId,
      newChapterNom: destination.newChapterNom,
    }));

    try {
      const { status, data } = await fetchJson<SaveFichesResponse>("/api/fiches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: toSave }),
      });

      if (status < 200 || status >= 300 || !data || data.saved === 0) {
        setError(data?.error ?? "Échec de l'enregistrement.");
        setPhase("picking-chapter");
        return;
      }

      fetch(`/api/fiches/drafts/${draftId}`, { method: "DELETE" }).catch(() => {});
      setPhase("done");
      setTimeout(() => {
        router.push("/fiches");
        router.refresh();
      }, 900);
    } catch (err) {
      setError(err instanceof RequestFailedError ? err.message : "Erreur réseau pendant l'enregistrement.");
      setPhase("picking-chapter");
    }
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="text-4xl">🎉</div>
        <p className="text-lg font-medium">
          Fiche{items.length > 1 ? "s" : ""} enregistrée{items.length > 1 ? "s" : ""} !
        </p>
      </div>
    );
  }

  if (phase === "draft-error") {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="mb-4 text-sm text-danger">{error ?? "Brouillon introuvable ou expiré."}</p>
        <Button onClick={() => router.push("/fiches/new")}>Recommencer une fiche</Button>
      </Card>
    );
  }

  if (phase === "checkout-cancelled") {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="mb-4 text-sm">Paiement annulé — ta fiche est toujours prête à être enregistrée.</p>
        {error && <p className="mb-3 text-sm text-danger">{error}</p>}
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={() => router.push("/fiches/new")}>
            Retour
          </Button>
          <Button onClick={startCheckout} disabled={checkoutLoading}>
            {checkoutLoading ? "Redirection…" : "Réessayer le paiement"}
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "not-subscribed") {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h1 className="mb-2 font-heading text-2xl font-semibold">
          Profite pleinement de tes fiches
        </h1>
        <p className="mb-6 text-sm text-text-muted">
          Un abonnement actif est nécessaire pour enregistrer et relire tes fiches en entier.
        </p>
        {error && <p className="mb-3 text-sm text-danger">{error}</p>}
        <Button onClick={startCheckout} disabled={checkoutLoading}>
          {checkoutLoading ? "Redirection…" : "S'abonner — 9,99 €/mois"}
        </Button>
      </Card>
    );
  }

  if (
    phase === "checking-subscription" ||
    phase === "waiting-subscription" ||
    phase === "loading-draft"
  ) {
    return (
      <Card className="mx-auto max-w-md">
        <div className="flex items-center justify-center py-12">
          <FicheLoader />
        </div>
      </Card>
    );
  }

  if (phase === "subscription-timeout") {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="mb-4 text-sm">
          Ton paiement a été reçu mais l&apos;activation prend plus de temps que prévu.
        </p>
        <Button
          onClick={() => {
            pollCount.current = 0;
            setPhase("checking-subscription");
            setRetryTick((n) => n + 1);
          }}
        >
          Réessayer
        </Button>
      </Card>
    );
  }

  if (phase === "reviewing") {
    return (
      <div className="flex flex-col gap-8 pb-24">
        {items.map((item) => (
          <div key={item.key} className="flex flex-col gap-3">
            <Input
              value={item.titre}
              onChange={(e) => updateItem(item.key, { titre: e.target.value })}
              className="mx-auto w-full max-w-xl"
            />
            <ProposalPreview contenu={item.contenu} isSubscribed />
          </div>
        ))}
        <div className="sticky bottom-4 mx-auto flex w-full max-w-xl flex-col gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-success bg-[#123424] px-4 py-3 text-sm text-success">
            <span aria-hidden>✓</span>
            <span>Abonnement activé — tu as maintenant accès à tes fiches.</span>
          </div>
          <Button className="w-full" onClick={() => setPhase("picking-subject")}>
            Enregistrer les fiches
          </Button>
        </div>
      </div>
    );
  }

  // phase is "picking-subject", "picking-chapter", or "saving"
  const hasSubject = Boolean(destination.subjectId || destination.newSubjectNom);
  const hasChapter = Boolean(destination.chapterId || destination.newChapterNom);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 pb-24">
      <button
        type="button"
        onClick={() => setPhase("reviewing")}
        className="self-start text-sm font-medium text-accent hover:underline"
      >
        ← Modifier les fiches
      </button>

      <Card className="flex flex-col gap-5">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
          Où ranger ces {items.length} fiche{items.length > 1 ? "s" : ""} ?
        </p>

        {error && (
          <p className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <p className="text-sm text-text-muted">Matière</p>

          {hasSubject ? (
            <button
              type="button"
              onClick={() => {
                setDestination({});
                setCreatingSubject(false);
                setNewSubjectDraft("");
              }}
              className="self-start text-sm text-text-muted hover:text-accent"
            >
              ← {chosenSubject?.nom ?? destination.newSubjectNom} — changer
            </button>
          ) : (
            <>
              {subjects.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {subjects.map((s) => {
                    const color = subjectColors.get(s.nom)!;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => chooseExistingSubject(s.id)}
                        className="flex aspect-[4/3] items-center justify-center rounded-2xl border p-3 text-center font-heading font-semibold shadow-sm transition-transform active:scale-[0.97]"
                        style={{ backgroundColor: color.bg, borderColor: color.border, color: color.text }}
                      >
                        {s.nom}
                      </button>
                    );
                  })}
                </div>
              )}

              {creatingSubject ? (
                <Input
                  autoFocus
                  placeholder="Nom de la matière"
                  value={newSubjectDraft}
                  onChange={(e) => setNewSubjectDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmNewSubject()}
                />
              ) : (
                <Button variant="outline" size="sm" className="self-start" onClick={() => setCreatingSubject(true)}>
                  + Nouvelle
                </Button>
              )}
              {creatingSubject && (
                <Button size="sm" className="self-start" onClick={confirmNewSubject} disabled={!newSubjectDraft.trim()}>
                  Valider
                </Button>
              )}
            </>
          )}
        </div>

        {hasSubject && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">Chapitre</p>

            {chapterOptions.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {chapterOptions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => chooseExistingChapter(c.id)}
                    className={`flex aspect-[4/3] items-center justify-center rounded-2xl border p-3 text-center font-heading font-semibold shadow-sm transition-all active:scale-[0.97] ${
                      destination.chapterId === c.id
                        ? "border-accent bg-accent text-[#191A2E]"
                        : "border-border bg-bg-elevated text-text hover:border-accent"
                    }`}
                  >
                    {c.nom}
                  </button>
                ))}
              </div>
            )}

            {creatingChapter ? (
              <Input
                autoFocus
                placeholder="Nom du chapitre"
                value={newChapterDraft}
                onChange={(e) => setNewChapterDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmNewChapter()}
              />
            ) : (
              <Button
                variant={destination.newChapterNom ? "primary" : "outline"}
                size="sm"
                className="self-start"
                onClick={() => setCreatingChapter(true)}
              >
                {destination.newChapterNom ? `Nouveau : ${destination.newChapterNom}` : "+ Nouveau"}
              </Button>
            )}
            {creatingChapter && (
              <Button size="sm" className="self-start" onClick={confirmNewChapter} disabled={!newChapterDraft.trim()}>
                Valider
              </Button>
            )}
          </div>
        )}
      </Card>

      <Button className="w-full" onClick={handleSave} disabled={phase === "saving" || !hasChapter}>
        {phase === "saving" ? "Enregistrement…" : "✓ Confirmer et ranger"}
      </Button>
    </div>
  );
}
