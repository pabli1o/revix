"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function RootSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-2xl font-semibold text-accent">Revix</h1>
      <p className="max-w-md text-sm text-text-muted">
        {error.message || "Une erreur inattendue s'est produite."}
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-text-muted">Référence : {error.digest}</p>
      )}
      <Button onClick={() => reset()}>Réessayer</Button>
    </div>
  );
}
