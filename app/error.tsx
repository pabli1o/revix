"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";

export default function RootSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-2xl font-semibold text-accent">Reviix</h1>
      <p className="max-w-md text-sm text-text-muted">{error.message || t.root.errorBoundary.defaultMessage}</p>
      {error.digest && (
        <p className="font-mono text-xs text-text-muted">
          {t.root.errorBoundary.reference}
          {error.digest}
        </p>
      )}
      <Button onClick={() => reset()}>{t.common.retry}</Button>
    </div>
  );
}
