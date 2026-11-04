"use client";

import { Loader2, X } from "lucide-react";
import type { SavedGraphic } from "@/api/operations/graphics.api";
import { useSavedGraphics } from "@/hooks/useSavedGraphics";
import GraphicThumb from "./GraphicThumb";

/** Mount only while open: each opening loads the current list. */
export default function SavedGraphicsPicker({
  onPick,
  onClose,
}: {
  onPick: (graphic: SavedGraphic) => void;
  onClose: () => void;
}) {
  const { graphics, loading, failed, hasMore, loadMore } = useSavedGraphics();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-graphics-title"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 id="saved-graphics-title" className="text-lg font-bold text-foreground">
            Saved graphics
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {failed ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              We couldn&apos;t load your graphics. Please try again.
            </p>
          ) : !loading && graphics.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No saved graphics yet. Every file you upload is saved here.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {graphics.map((graphic) => (
                <button
                  key={graphic.id}
                  type="button"
                  onClick={() => onPick(graphic)}
                  className="group min-w-0 text-left"
                >
                  <span className="block aspect-square overflow-hidden rounded-xl border border-border bg-card transition group-hover:border-primary">
                    <GraphicThumb graphic={graphic} />
                  </span>
                  <span className="mt-1 block truncate text-[11px] font-medium text-foreground" title={graphic.original_name}>
                    {graphic.original_name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {hasMore && !loading && (
            <button
              type="button"
              onClick={loadMore}
              className="mx-auto mt-5 block rounded-lg border border-input px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Show more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
