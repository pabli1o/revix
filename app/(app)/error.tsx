"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-2xl font-semibold">{t.root.errorBoundary.title}</h1>
      <p className="max-w-md text-sm text-text-muted">{error.message || t.root.errorBoundary.defaultMessage}</p>
      {error.digest && (
        <p className="font-mono text-xs text-text-muted">
          {t.root.errorBoundary.reference}
          {error.digest}
        </p>
      )}
      <div className="flex gap-3">
        <Button onClick={() => reset()}>{t.common.retry}</Button>
        <Button variant="secondary" onClick={() => router.push("/fiches")}>
          {t.root.errorBoundary.backHome}
        </Button>
      </div>
    </div>
  );
}
