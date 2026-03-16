// components/product/customization/ProductActions.tsx

import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag } from "lucide-react";

export default function ProductActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button variant="hero" className="flex-1 gap-2">
        <ShoppingBag className="h-5 w-5" />
        Add to Cart
      </Button>

      <Button variant="outline" className="gap-2">
        <Heart className="h-5 w-5" />
        Save for Later
      </Button>
    </div>
  );
}
