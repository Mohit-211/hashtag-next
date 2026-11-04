"use client";

import { Download, Loader2 } from "lucide-react";
import GraphicThumb from "@/components/graphics/GraphicThumb";
import { formatBytes } from "@/components/graphics/graphicFiles";
import { useSavedGraphics } from "@/hooks/useSavedGraphics";

/** Every file the customer has uploaded. Uploading saves it: there's nothing to do here but look or download. */
export default function SavedGraphicsSection() {
  const { graphics, loading, failed, hasMore, loadMore } = useSavedGraphics();

  return (
    <div className="bg-card border border-border rounded-xl p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold text-foreground">Saved Graphics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Every file you upload is saved here, ready to choose again when you customize a product.
        </p>
      </div>

      {failed ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          We couldn&apos;t load your graphics. Please try again.
        </p>
      ) : !loading && graphics.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No saved graphics yet. Upload a logo while customizing a product and it appears here.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {graphics.map((graphic) => (
            <li key={graphic.id} className="min-w-0">
              <div className="aspect-square overflow-hidden rounded-xl border border-border bg-card">
                <GraphicThumb graphic={graphic} />
              </div>
              <p className="mt-1.5 truncate text-xs font-medium text-foreground" title={graphic.original_name}>
                {graphic.original_name}
              </p>
              <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span>{formatBytes(graphic.file_size)}</span>
                <a
                  href={graphic.file_url}
                  className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                  aria-label={`Download ${graphic.original_name}`}
                >
                  <Download className="h-3 w-3" /> Download
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {hasMore && !loading && (
        <button
          type="button"
          onClick={loadMore}
          className="mx-auto block rounded-lg border border-input px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          Show more
        </button>
      )}
    </div>
  );
}
