"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { fetchJson, RequestFailedError } from "@/lib/fetch-json";
import type { FicheProposal, SaveFicheItem, SaveFichesResponse } from "@/lib/fiches/types";
import { SourcePicker, type PendingSource } from "./source-picker";
import { ProposalPreview } from "./proposal-preview";

interface SubjectOption {
  id: string;
  nom: string;
}
interface ChapterOption {
  id: string;
  nom: string;
  subject_id: string;
}

interface ValidationItem {
  key: string;
  proposal: FicheProposal;
  selected: boolean;
  titre: string;
  subjectChoice: string; // subject id, or "__new__"
  newSubjectNom: string;
  chapterChoice: string; // chapter id, or "__new__"
  newChapterNom: string;
}

type Step = "sources" | "generating" | "validation" | "saving";

export function CreationFlow({
  subjects,
  chapters,
  isSubscribed,
}: {
  subjects: SubjectOption[];
  chapters: ChapterOption[];
  isSubscribed: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("sources");
  const [sources, setSources] = useState<PendingSource[]>([]);
  const [items, setItems] = useState<ValidationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
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
          subjectChoice: subjects[0]?.id ?? "__new__",
          newSubjectNom: subjects.length === 0 ? "Nouvelle matière" : "",
          chapterChoice: "__new__",
          newChapterNom: "",
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

  async function handleSave() {
    setError(null);
    setStep("saving");

    const toSave: SaveFicheItem[] = items
      .filter((it) => it.selected)
      .map((it) => ({
        titre: it.titre,
        contenu: it.proposal.contenu,
        sources: sources.map((s) => ({ type: s.type, nom: s.nom })),
        subjectId: it.subjectChoice !== "__new__" ? it.subjectChoice : undefined,
        newSubjectNom: it.subjectChoice === "__new__" ? it.newSubjectNom : undefined,
        chapterId: it.chapterChoice !== "__new__" ? it.chapterChoice : undefined,
        newChapterNom: it.chapterChoice === "__new__" ? it.newChapterNom : undefined,
      }));

    if (toSave.length === 0) {
      setError("Sélectionne au moins une fiche à enregistrer.");
      setStep("validation");
      return;
    }

    try {
      const { status, data } = await fetchJson<SaveFichesResponse>("/api/fiches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: toSave }),
      });

      if (status === 402) {
        setError("Un abonnement actif est nécessaire pour enregistrer une fiche.");
        setStep("validation");
        return;
      }

      if (data && data.saved > 0) {
        setResultMessage(`${data.saved} fiche${data.saved > 1 ? "s" : ""} enregistrée${data.saved > 1 ? "s" : ""} !`);
        setTimeout(() => {
          router.push("/fiches");
          router.refresh();
        }, 900);
      } else {
        setError(data?.error ?? "Échec de l'enregistrement.");
        setStep("validation");
      }
    } catch (err) {
      setError(err instanceof RequestFailedError ? err.message : "Erreur réseau pendant l'enregistrement.");
      setStep("validation");
    }
  }

  if (step === "saving" && resultMessage) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="text-4xl">🎉</div>
        <p className="text-lg font-medium">{resultMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-3xl font-semibold">Nouvelle fiche</h1>

      {error && (
        <p className="mb-4 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      {(step === "sources" || step === "generating") && (
        <Card>
          <SourcePicker sources={sources} onChange={setSources} />
          <Button
            className="mt-6 w-full"
            disabled={sources.length === 0 || step === "generating"}
            onClick={handleGenerate}
          >
            {step === "generating" ? "Génération en cours…" : "Générer la fiche ✨"}
          </Button>
        </Card>
      )}

      {(step === "validation" || step === "saving") && (
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

              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Matière</label>
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
                    <option value="__new__">+ Nouvelle matière</option>
                  </select>
                  {item.subjectChoice === "__new__" && (
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

              <ProposalPreview contenu={item.proposal.contenu} isSubscribed={isSubscribed} />
            </Card>
          ))}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep("sources")}>
              Retour
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={step === "saving"}>
              {step === "saving" ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
