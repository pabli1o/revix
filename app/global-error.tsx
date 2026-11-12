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
          background: "#ffffff",
          color: "#17181b",
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
        <h1 style={{ color: "#1e3a5f", fontSize: "1.5rem", fontWeight: 700 }}>Reviix</h1>
        <p style={{ maxWidth: 420, fontSize: "0.875rem", color: "#595f66" }}>
          {error.message || "Une erreur inattendue s'est produite."}
        </p>
        {error.digest && (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#595f66" }}>
            Référence : {error.digest}
          </p>
        )}
        <button
          onClick={() => reset()}
          style={{
            background: "#1e3a5f",
            color: "#ffffff",
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
