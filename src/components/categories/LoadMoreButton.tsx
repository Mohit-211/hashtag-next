"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";

interface Props {
  hasMore: boolean;
  onLoadMore: () => void;
  currentCount?: number;
  totalCount?: number;
}

export default function LoadMoreButton({
  hasMore,
  onLoadMore,
  currentCount,
  totalCount,
}: Props) {
  const [loading, setLoading] = useState(false);

  if (!hasMore) {
    if (totalCount && totalCount > 0) {
      return (
        <div className="flex flex-col items-center gap-2 mt-12">
          <div className="h-px w-16 bg-border" />
          <p className="text-xs text-muted-foreground">
            All {totalCount} products shown
          </p>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    setLoading(true);
    await Promise.resolve(onLoadMore());
    setTimeout(() => setLoading(false), 400);
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-12">
      {/* Progress indicator */}
      {currentCount && totalCount && (
        <div className="flex flex-col items-center gap-1.5 mb-1">
          <div className="w-48 h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2d4a35] rounded-full transition-all duration-500"
              style={{ width: `${(currentCount / totalCount) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            {currentCount} of {totalCount} products
          </p>
        </div>
      )}

      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:border-[#4a7a58] hover:text-[#2d4a35] hover:bg-[#e8f0ea] transition-all duration-150 disabled:opacity-60 disabled:pointer-events-none"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        {loading ? "Loading…" : "Load More"}
      </button>
    </div>
  );
}