"use client";

import { Button } from "@/components/ui/button";

interface Props {
  reset: () => void;
}

export default function EmptyProducts({ reset }: Props) {
  return (
    <div className="text-center py-20">
      <p className="text-lg text-muted-foreground max-w-md mx-auto">
        No products match your filters.
      </p>

      <Button className="mt-6" onClick={reset}>
        Reset Filters
      </Button>
    </div>
  );
}
