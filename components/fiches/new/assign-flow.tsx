"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { fetchJson, RequestFailedError } from "@/lib/fetch-json";
import { FicheLoader } from "./fiche-loader";
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
  subjectChoice: string; // subject id, or "__new__"
  newSubjectNom: string;
  chapterChoice: string; // chapter id, or "__new__"
  newChapterNom: string;
}

const DEFAULT_FIRST_SUBJECT_NOM = "Général";
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
  | "assigning"
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
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const pollCount = useRef(0);

  const isFirstEverFiche = subjects.length === 0;
  const canCreateSubject = !isFirstEverFiche;

  // Poll /api/me until the subscription webhook has landed (it can arrive
  // slightly after Stripe redirects the browser back here).
  useEffect(() => {
    if (phase !== "checking-subscription") return;
    let cancelled = false;

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
      setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [phase]);

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
          data.items.map((it, i) => ({
            key: `${i}-${it.titre}`,
            titre: it.titre,
            contenu: it.contenu,
            subjectChoice: isFirstEverFiche ? "__new__" : subjects[0].id,
            newSubjectNom: isFirstEverFiche ? DEFAULT_FIRST_SUBJECT_NOM : "",
            chapterChoice: "__new__",
            newChapterNom: "",
          })),
        );
        setSources(data.sources);
        setPhase("assigning");
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

  async function handleSave() {
    setError(null);
    setPhase("saving");

    const toSave = items.map((it) => ({
      titre: it.titre,
      contenu: it.contenu,
      sources,
      subjectId: it.subjectChoice !== "__new__" ? it.subjectChoice : undefined,
      newSubjectNom: it.subjectChoice === "__new__" ? it.newSubjectNom : undefined,
      chapterId: it.chapterChoice !== "__new__" ? it.chapterChoice : undefined,
      newChapterNom: it.chapterChoice === "__new__" ? it.newChapterNom : undefined,
    }));

    try {
      const { status, data } = await fetchJson<SaveFichesResponse>("/api/fiches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: toSave }),
      });

      if (status < 200 || status >= 300 || !data || data.saved === 0) {
        setError(data?.error ?? "Échec de l'enregistrement.");
        setPhase("assigning");
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
      setPhase("assigning");
    }
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="text-4xl">🎉</div>
        <p className="text-lg font-medium">Fiche{items.length > 1 ? "s" : ""} enregistrée{items.length > 1 ? "s" : ""} !</p>
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
        <p className="mb-4 text-sm">
          Un abonnement actif est nécessaire pour enregistrer cette fiche.
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
        <div className="flex flex-col items-center gap-5 py-12 text-center">
          <FicheLoader />
          <p className="font-heading text-lg font-semibold">
            {phase === "loading-draft" ? "Récupération de ta fiche…" : "Finalisation de ton abonnement…"}
          </p>
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
          }}
        >
          Réessayer
        </Button>
      </Card>
    );
  }

  // phase is "assigning" or "saving"
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-3xl font-semibold">Où ranger cette fiche ?</h1>

      {error && (
        <p className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      {items.map((item) => (
        <Card key={item.key}>
          <Input
            value={item.titre}
            onChange={(e) => updateItem(item.key, { titre: e.target.value })}
            className="mb-3"
          />

          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Matière</label>
              {isFirstEverFiche ? (
                <p className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-muted">
                  Classée automatiquement dans « {DEFAULT_FIRST_SUBJECT_NOM} » — tu pourras créer
                  d&apos;autres matières après ce premier enregistrement.
                </p>
              ) : (
                <select
                  className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
                  value={item.subjectChoice}
                  onChange={(e) =>
                    updateItem(item.key, { subjectChoice: e.target.value, chapterChoice: "__new__" })
                  }
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom}
                    </option>
                  ))}
                  {canCreateSubject && <option value="__new__">+ Nouvelle matière</option>}
                </select>
              )}
              {!isFirstEverFiche && item.subjectChoice === "__new__" && (
                <Input
                  className="mt-2"
                  placeholder="Nom de la matière"
                  value={item.newSubjectNom}
                  onChange={(e) => updateItem(item.key, { newSubjectNom: e.target.value })}
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Chapitre</label>
              <select
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
                value={item.chapterChoice}
                disabled={item.subjectChoice === "__new__"}
                onChange={(e) => updateItem(item.key, { chapterChoice: e.target.value })}
              >
                {chapters
                  .filter((c) => c.subject_id === item.subjectChoice)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                <option value="__new__">+ Nouveau chapitre</option>
              </select>
              {item.chapterChoice === "__new__" && (
                <Input
                  className="mt-2"
                  placeholder="Nom du chapitre"
                  value={item.newChapterNom}
                  onChange={(e) => updateItem(item.key, { newChapterNom: e.target.value })}
                />
              )}
            </div>
          </div>

          <ProposalPreview contenu={item.contenu} isSubscribed />
        </Card>
      ))}

      <div className="flex gap-3">
        <Button className="flex-1" onClick={handleSave} disabled={phase === "saving"}>
          {phase === "saving" ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
