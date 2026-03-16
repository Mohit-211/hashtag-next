"use client";

import { Button } from "@/components/ui/button";

interface Props {
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function LoadMoreButton({ hasMore, onLoadMore }: Props) {
  if (!hasMore) return null;

  return (
    <div className="text-center mt-12">
      <Button variant="outline" size="lg" onClick={onLoadMore}>
        Load More
      </Button>
    </div>
  );
}
