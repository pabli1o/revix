"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="fr">
      <body
        style={{
          background: "#191a2e",
          color: "#f2f1ea",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          textAlign: "center",
          padding: "1rem",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ color: "#e8a33d", fontSize: "1.5rem", fontWeight: 600 }}>Revix</h1>
        <p style={{ maxWidth: 420, fontSize: "0.875rem", color: "#b3b3c9" }}>
          {error.message || "Une erreur inattendue s'est produite."}
        </p>
        {error.digest && (
          <p style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#b3b3c9" }}>
            Référence : {error.digest}
          </p>
        )}
        <button
          onClick={() => reset()}
          style={{
            background: "#e8a33d",
            color: "#191a2e",
            border: "none",
            borderRadius: "0.75rem",
            padding: "0.625rem 1.25rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
