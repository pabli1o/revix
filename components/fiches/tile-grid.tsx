"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { SubjectColor } from "@/lib/theme/subject-colors";

export interface TileItem {
  id: string;
  nom: string;
  count: number;
  countLabel: string;
  color: SubjectColor;
}

export function TileGrid({
  items,
  hrefFor,
  renameEndpoint,
  emptyMessage,
}: {
  items: TileItem[];
  hrefFor: (id: string) => string;
  renameEndpoint: (id: string) => string;
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="text-text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <Tile key={item.id} item={item} href={hrefFor(item.id)} renameUrl={renameEndpoint(item.id)} />
      ))}
    </div>
  );
}

function Tile({ item, href, renameUrl }: { item: TileItem; href: string; renameUrl: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.nom);
  const [saving, setSaving] = useState(false);

  async function submitRename() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === item.nom) {
      setEditing(false);
      setValue(item.nom);
      return;
    }
    setSaving(true);
    await fetch(renameUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // Subjects/chapters expect `nom`, fiches expect `titre` — sending
      // both keeps this component generic across all three rename routes.
      body: JSON.stringify({ nom: trimmed, titre: trimmed }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <div
      className="group relative flex aspect-[4/3] flex-col justify-between rounded-2xl border p-4 shadow-sm transition-transform hover:-translate-y-0.5"
      style={{ backgroundColor: item.color.bg, borderColor: item.color.border, color: item.color.text }}
    >
      {!editing ? (
        <>
          <Link href={href} className="absolute inset-0" aria-label={item.nom} />
          <div className="flex items-start justify-between">
            <span className="font-heading text-lg font-semibold leading-tight">{item.nom}</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setEditing(true);
              }}
              className="relative z-10 rounded-md p-1 opacity-0 transition-opacity hover:bg-black/10 group-hover:opacity-100"
              aria-label="Renommer"
              title="Renommer"
            >
              ✎
            </button>
          </div>
          <span className="font-mono text-xs uppercase tracking-wide opacity-80">
            {item.countLabel}
          </span>
        </>
      ) : (
        <div className="relative z-10 flex h-full flex-col justify-center gap-2">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") {
                setEditing(false);
                setValue(item.nom);
              }
            }}
            className="w-full rounded-md border border-black/20 bg-white/90 px-2 py-1 text-sm text-[#191A2E]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={submitRename}
              className={clsx(
                "rounded-md bg-black/20 px-2 py-1 text-xs font-medium hover:bg-black/30",
              )}
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setValue(item.nom);
              }}
              className="rounded-md px-2 py-1 text-xs font-medium hover:bg-black/10"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
