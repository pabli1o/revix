"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { SubjectColor } from "@/lib/theme/subject-colors";
import { EmptyState } from "@/components/ui/empty-state";

export interface TileItem {
  id: string;
  nom: string;
  count: number;
  countLabel: string;
  color: SubjectColor;
  href: string;
  renameUrl: string;
}

export function TileGrid({
  items,
  emptyMessage,
  allowDelete = false,
  deleteWarning,
}: {
  items: TileItem[];
  emptyMessage: string;
  /** Shows a delete (🗑️) action alongside rename — only meaningful for
   * matières/chapitres: deleting them cascades to a HARD delete of their
   * fiches (see the DELETE handlers), bypassing the corbeille. Fiche
   * tiles have their own dedicated soft-delete flow (FicheViewer's
   * "Corbeille" button) and should never set this. */
  allowDelete?: boolean;
  /** Confirmation message template, with "{nom}" replaced by the tile's
   * name. A plain string, not a function: this component is a Client
   * Component instantiated from Server Component pages, and a function
   * prop can't cross that boundary (see the earlier hrefFor/renameEndpoint
   * bug in this same file — React error #441 in production). */
  deleteWarning?: string;
}) {
  if (items.length === 0) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <Tile
          key={item.id}
          item={item}
          href={item.href}
          renameUrl={item.renameUrl}
          allowDelete={allowDelete}
          deleteWarning={deleteWarning}
        />
      ))}
    </div>
  );
}

function Tile({
  item,
  href,
  renameUrl,
  allowDelete,
  deleteWarning,
}: {
  item: TileItem;
  href: string;
  renameUrl: string;
  allowDelete: boolean;
  deleteWarning?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.nom);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function submitRename() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === item.nom) {
      setEditing(false);
      setValue(item.nom);
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(renameUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Subjects/chapters expect `nom`, fiches expect `titre` — sending
        // both keeps this component generic across all three rename routes.
        body: JSON.stringify({ nom: trimmed, titre: trimmed }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setActionError(data?.error ?? "Le renommage a échoué.");
        setSaving(false);
        return;
      }
      setSaving(false);
      setEditing(false);
      router.refresh();
    } catch {
      setActionError("Erreur réseau — le renommage a échoué.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    const message = deleteWarning
      ? deleteWarning.replace("{nom}", item.nom)
      : `Supprimer « ${item.nom} » ? Cette action est définitive.`;
    if (!window.confirm(message)) return;
    setDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(renameUrl, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setActionError(data?.error ?? "La suppression a échoué.");
        setDeleting(false);
        return;
      }
      router.refresh();
    } catch {
      setActionError("Erreur réseau — la suppression a échoué.");
      setDeleting(false);
    }
  }

  return (
    <div
      className="group relative flex aspect-[4/3] flex-col justify-between rounded-2xl border-2 p-4 text-text shadow-sm transition-transform hover:-translate-y-0.5"
      style={{ backgroundColor: `${item.color.bg}26`, borderColor: item.color.border }}
    >
      {!editing ? (
        <>
          <Link href={href} className="absolute inset-0" aria-label={item.nom} />
          <div className="flex items-start justify-between gap-1">
            <span className="font-heading text-xl font-semibold leading-tight">{item.nom}</span>
            {/* Always visible (not hover-gated): hover has no equivalent on
               touch devices, so gating these behind group-hover made them
               practically impossible to reach on phones/tablets. */}
            <div className="relative z-10 flex shrink-0 gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setEditing(true);
                }}
                className="rounded-full bg-white/10 p-1.5 leading-none backdrop-blur-sm transition-colors hover:bg-white/20 active:scale-90"
                aria-label="Renommer"
                title="Renommer"
              >
                ✎
              </button>
              {allowDelete && (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete();
                  }}
                  className="rounded-full bg-white/10 p-1.5 leading-none backdrop-blur-sm transition-colors hover:bg-white/20 active:scale-90"
                  aria-label="Supprimer"
                  title="Supprimer"
                >
                  {deleting ? "…" : "🗑️"}
                </button>
              )}
            </div>
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

      {actionError && (
        <p className="absolute inset-x-2 bottom-2 z-10 rounded-md bg-black/80 px-2 py-1 text-center text-xs text-white">
          {actionError}
        </p>
      )}
    </div>
  );
}
