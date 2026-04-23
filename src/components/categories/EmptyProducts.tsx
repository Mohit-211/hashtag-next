"use client";

import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  reset: () => void;
}

export default function EmptyProducts({ reset }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-5">
        <PackageSearch className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
        No products found
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
        We couldn't find any products in this category. Try browsing a
        different one or reset to see all products.
      </p>
      <Button
        onClick={reset}
        className="bg-[#2d4a35] hover:bg-[#1e3326] text-white rounded-xl px-6"
      >
        View All Products
      </Button>
    </div>
  );
}