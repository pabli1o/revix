"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchJson, RequestFailedError } from "@/lib/fetch-json";
import type { QuizDifficulty, QuizQuestion } from "@/lib/supabase/database.types";

const DIFFICULTIES: { value: QuizDifficulty; label: string; emoji: string }[] = [
  { value: "facile", label: "Facile", emoji: "🌱" },
  { value: "moyen", label: "Moyen", emoji: "🔥" },
  { value: "difficile", label: "Difficile", emoji: "🧠" },
];

interface Attempt {
  id: string;
  score: number;
  total: number;
  created_at: string;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

type Phase = "select" | "loading" | "playing" | "finished";

export function QuizFlow({ chapterId, chapterNom }: { chapterId: string; chapterNom: string }) {
  const [phase, setPhase] = useState<Phase>("select");
  const [difficulty, setDifficulty] = useState<QuizDifficulty | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [historyByDifficulty, setHistoryByDifficulty] = useState<Record<string, Attempt[]>>({});
  const [error, setError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const [finalScore, setFinalScore] = useState<{ score: number; total: number; previousScore: number | null } | null>(
    null,
  );

  useEffect(() => {
    Promise.all(
      DIFFICULTIES.map((d) =>
        fetch(`/api/quiz/attempts?chapterId=${chapterId}&difficulty=${d.value}`)
          .then((r) => r.json())
          .then((data) => [d.value, data.attempts ?? []] as const),
      ),
    ).then((entries) => setHistoryByDifficulty(Object.fromEntries(entries)));
  }, [chapterId]);

  async function startQuiz(diff: QuizDifficulty) {
    setDifficulty(diff);
    setPhase("loading");
    setError(null);
    try {
      const { status, data } = await fetchJson<{ questions?: QuizQuestion[]; error?: string }>(
        `/api/quiz/${chapterId}?difficulty=${diff}`,
      );
      if (status < 200 || status >= 300 || !data?.questions) {
        setError(data?.error ?? "Impossible de charger le quiz.");
        setPhase("select");
        return;
      }
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(null));
      setIndex(0);
      setSelected(null);
      setConfirmed(false);
      setPhase("playing");
    } catch (err) {
      setError(err instanceof RequestFailedError ? err.message : "Erreur réseau.");
      setPhase("select");
    }
  }

  function confirmAnswer() {
    if (selected === null) return;
    setConfirmed(true);
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = selected;
      return next;
    });
  }

  async function nextQuestion() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setSelected(null);
      setConfirmed(false);
    } else {
      await finishQuiz();
    }
  }

  async function finishQuiz() {
    setPhase("loading");
    const res = await fetch("/api/quiz/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId, difficulty, reponses: answers }),
    });
    const data = await res.json();
    if (!res.ok || typeof data.score !== "number") {
      setError(data.error ?? "Impossible d'enregistrer le résultat du quiz.");
      setPhase("select");
      return;
    }
    setFinalScore({ score: data.score, total: data.total, previousScore: data.previousScore });
    setPhase("finished");
    if (difficulty) {
      const refreshed = await fetch(`/api/quiz/attempts?chapterId=${chapterId}&difficulty=${difficulty}`).then(
        (r) => r.json(),
      );
      setHistoryByDifficulty((prev) => ({ ...prev, [difficulty]: refreshed.attempts ?? [] }));
    }
  }

  if (phase === "select" || phase === "loading") {
    return (
      <div>
        <h1 className="mb-1 font-heading text-3xl font-semibold">Quiz — {chapterNom}</h1>
        <p className="mb-6 text-text-muted">Choisis un niveau de difficulté.</p>
        {error && <p className="mb-4 text-sm text-danger">{error}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {DIFFICULTIES.map((d) => {
            const history = historyByDifficulty[d.value] ?? [];
            const last = history[0];
            return (
              <Card key={d.value} className="flex flex-col items-center gap-3 text-center">
                <span className="text-3xl">{d.emoji}</span>
                <span className="font-heading text-lg font-semibold">{d.label}</span>
                {last ? (
                  <span className="font-mono text-sm text-text-muted">
                    Dernier score : {last.score}/{last.total}
                  </span>
                ) : (
                  <span className="text-sm text-text-muted">Pas encore tenté</span>
                )}
                <Button
                  size="sm"
                  className="w-full"
                  disabled={phase === "loading" && difficulty === d.value}
                  onClick={() => startQuiz(d.value)}
                >
                  {phase === "loading" && difficulty === d.value
                    ? "Préparation…"
                    : last
                      ? "Refaire"
                      : "Commencer"}
                </Button>
                {history.length > 0 && (
                  <ul className="mt-1 w-full text-left text-xs text-text-muted">
                    {history.slice(0, 3).map((a) => (
                      <li key={a.id} className="flex justify-between border-t border-border py-1 first:border-t-0">
                        <span>{DATE_FORMATTER.format(new Date(a.created_at))}</span>
                        <span>
                          {a.score}/{a.total}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === "playing") {
    const question = questions[index];
    const isCorrect = selected === question.reponseIndex;
    return (
      <div>
        <p className="mb-4 text-sm text-text-muted">
          Question {index + 1} / {questions.length}
        </p>
        <Card>
          <h2 className="mb-5 font-heading text-xl font-semibold">{question.question}</h2>
          <div className="flex flex-col gap-2">
            {question.choix.map((choice, i) => {
              const isSelected = selected === i;
              const showState = confirmed && (i === question.reponseIndex || isSelected);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={confirmed}
                  onClick={() => setSelected(i)}
                  className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                    showState
                      ? i === question.reponseIndex
                        ? "border-success bg-success/15"
                        : "border-danger bg-danger/15"
                      : isSelected
                        ? "border-accent bg-accent/10"
                        : "border-border bg-bg-elevated hover:border-accent"
                  }`}
                >
                  {choice}
                </button>
              );
            })}
          </div>

          {confirmed && (
            <div
              className={`mt-4 rounded-lg border p-4 text-sm ${
                isCorrect ? "border-success/50 bg-success/10" : "border-danger/50 bg-danger/10"
              }`}
            >
              <p className="mb-1 font-semibold">
                {isCorrect ? "✅ Bonne réponse !" : "❌ Pas tout à fait."}
              </p>
              <p>{question.explication}</p>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            {!confirmed ? (
              <Button disabled={selected === null} onClick={confirmAnswer}>
                Confirmer
              </Button>
            ) : (
              <Button onClick={nextQuestion}>
                {index + 1 < questions.length ? "Question suivante" : "Voir mon score"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // finished
  const progress =
    finalScore?.previousScore !== null && finalScore?.previousScore !== undefined
      ? finalScore.score - finalScore.previousScore
      : null;

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="text-5xl">🎯</div>
      <h1 className="font-heading text-3xl font-semibold">
        {finalScore?.score} / {finalScore?.total}
      </h1>
      {progress !== null && progress !== 0 && (
        <p className="text-lg">
          {progress > 0 ? `🎉 +${progress}` : progress} par rapport à la dernière tentative
        </p>
      )}
      <div className="mt-4 flex gap-3">
        <Button variant="secondary" onClick={() => setPhase("select")}>
          Changer de niveau
        </Button>
        {difficulty && <Button onClick={() => startQuiz(difficulty)}>🔁 Refaire</Button>}
      </div>
      <Link href={`/fiches`} className="mt-2 text-sm text-text-muted hover:text-accent">
        Retour à mes fiches
      </Link>
    </div>
  );
}
