"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChoiceCard } from "@/components/ui/choice-card";
import { fetchJson, RequestFailedError } from "@/lib/fetch-json";
import { QuizLoader } from "./quiz-loader";
import type { QuizDifficulty, QuizQuestion } from "@/lib/supabase/database.types";
import { useLocale } from "@/components/i18n/locale-provider";

// Values sent to the API and used as object keys — stay the French
// literals the backend expects (see lib/anthropic/prompts.ts's
// DIFFICULTY_LABEL), independent of the UI's own display locale.
const DIFFICULTY_VALUES: QuizDifficulty[] = ["facile", "moyen", "difficile"];

interface Attempt {
  id: string;
  score: number;
  total: number;
  created_at: string;
}

// Not locale-parametrized yet — a separate pass handles date/number
// formatting across the app.
const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

type Phase = "select" | "loading" | "playing" | "finished";

export function QuizFlow({ chapterId, chapterNom }: { chapterId: string; chapterNom: string }) {
  const router = useRouter();
  const { t } = useLocale();
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
      DIFFICULTY_VALUES.map((value) =>
        fetch(`/api/quiz/attempts?chapterId=${chapterId}&difficulty=${value}`)
          .then((r) => (r.ok ? r.json() : { attempts: [] }))
          .then((data) => [value, data.attempts ?? []] as const)
          .catch(() => [value, []] as const),
      ),
    ).then((entries) => setHistoryByDifficulty(Object.fromEntries(entries)));
  }, [chapterId]);

  async function startQuiz(diff: QuizDifficulty) {
    setDifficulty(diff);
    setPhase("loading");
    setError(null);
    try {
      const { status, data } = await fetchJson<{
        questions?: QuizQuestion[];
        error?: string;
        aiUsageCapExceeded?: boolean;
      }>(`/api/quiz/${chapterId}?difficulty=${diff}`);
      if (status < 200 || status >= 300 || !data?.questions) {
        if (data?.aiUsageCapExceeded) {
          router.push("/limite");
          return;
        }
        setError(data?.error ?? t.quiz.unableToLoadQuiz);
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
      setError(err instanceof RequestFailedError ? err.message : t.quiz.networkError);
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
      setError(data.error ?? t.quiz.unableToSaveResult);
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

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <QuizLoader />
      </div>
    );
  }

  if (phase === "select") {
    return (
      <div>
        <h1 className="mb-1 font-heading text-3xl font-semibold">{t.quiz.quizTitle(chapterNom)}</h1>
        <p className="mb-6 text-text-muted">{t.quiz.chooseDifficulty}</p>
        {error && <p className="mb-4 text-sm text-danger">{error}</p>}
        <div className="flex flex-col gap-3">
          {DIFFICULTY_VALUES.map((value) => {
            const history = historyByDifficulty[value] ?? [];
            const last = history[0];
            return (
              <ChoiceCard
                key={value}
                title={t.quiz.difficulties[value]}
                description={
                  last
                    ? `${t.quiz.lastScore(last.score, last.total)} — ${
                        last.score === last.total ? t.quiz.retryToTrain : t.quiz.clickToRetry
                      }`
                    : t.quiz.notAttemptedClickToStart
                }
                onClick={() => startQuiz(value)}
              >
                {history.length > 1 && (
                  <ul className="mt-2 flex flex-col gap-0.5 text-xs text-text-muted">
                    {history.slice(1, 3).map((a) => (
                      <li key={a.id} className="flex justify-between">
                        <span>{DATE_FORMATTER.format(new Date(a.created_at))}</span>
                        <span>
                          {a.score}/{a.total}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </ChoiceCard>
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
        <p className="mb-4 text-sm text-text-muted">{t.quiz.questionProgress(index + 1, questions.length)}</p>
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
              <p className="mb-1 font-semibold">{isCorrect ? t.quiz.correctAnswer : t.quiz.wrongAnswer}</p>
              <p>{question.explication}</p>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            {!confirmed ? (
              <Button disabled={selected === null} onClick={confirmAnswer}>
                {t.quiz.confirmButton}
              </Button>
            ) : (
              <Button onClick={nextQuestion}>
                {index + 1 < questions.length ? t.quiz.nextQuestion : t.quiz.seeScore}
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
      <h1 className="font-heading text-3xl font-semibold">
        {finalScore?.score} / {finalScore?.total}
      </h1>
      {progress !== null && progress !== 0 && <p className="text-lg">{t.quiz.scoreDelta(progress)}</p>}
      <div className="mt-4 flex gap-3">
        <Button variant="secondary" onClick={() => setPhase("select")}>
          {t.quiz.changeDifficulty}
        </Button>
        {difficulty && <Button onClick={() => startQuiz(difficulty)}>{t.quiz.retryQuiz}</Button>}
      </div>
      <Link href={`/fiches`} prefetch={true} className="mt-2 text-sm text-text-muted hover:text-accent">
        {t.quiz.backToFiches}
      </Link>
    </div>
  );
}
