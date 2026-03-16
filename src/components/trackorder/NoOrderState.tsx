// components/trackorder/NoOrderState.tsx

import { Truck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NoOrderState() {
  return (
    <div className="text-center py-10 space-y-4">
      <div className="h-16 w-16 mx-auto rounded-full bg-secondary flex items-center justify-center">
        <Truck className="h-8 w-8 text-muted-foreground" />
      </div>

      <h2 className="text-xl font-heading font-bold">No Order to Track</h2>

      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Enter your Order ID above to track your order.
      </p>

      <Link href="/categories">
        <Button variant="hero" size="lg">
          Browse Products
        </Button>
      </Link>
    </div>
  );
}
