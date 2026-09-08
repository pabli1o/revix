"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface TrashedFiche {
  id: string;
  titre: string;
  subjectNom: string;
  chapterNom: string;
  deletedAt: string;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function TrashList({ items }: { items: TrashedFiche[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function restore(id: string) {
    setBusyId(id);
    await fetch(`/api/fiches/${id}/restore`, { method: "POST" });
    setBusyId(null);
    router.refresh();
  }

  async function deleteForever(id: string) {
    if (!window.confirm("Supprimer définitivement cette fiche ? Cette action est irréversible.")) {
      return;
    }
    setBusyId(id);
    await fetch(`/api/fiches/${id}?permanent=1`, { method: "DELETE" });
    setBusyId(null);
    router.refresh();
  }

  if (items.length === 0) {
    return <p className="text-text-muted">La corbeille est vide.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">{item.titre}</p>
            <p className="text-sm text-text-muted">
              {item.subjectNom} / {item.chapterNom} · supprimée le{" "}
              {DATE_FORMATTER.format(new Date(item.deletedAt))}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busyId === item.id}
              onClick={() => restore(item.id)}
            >
              ↩️ Restaurer
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={busyId === item.id}
              onClick={() => deleteForever(item.id)}
            >
              Supprimer définitivement
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
