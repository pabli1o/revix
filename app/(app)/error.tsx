"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-2xl font-semibold">Un problème est survenu</h1>
      <p className="max-w-md text-sm text-text-muted">
        {error.message || "Une erreur inattendue s'est produite."}
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-text-muted">Référence : {error.digest}</p>
      )}
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Réessayer</Button>
        <Button variant="secondary" onClick={() => router.push("/fiches")}>
          Retour à l&apos;accueil
        </Button>
      </div>
    </div>
  );
}
