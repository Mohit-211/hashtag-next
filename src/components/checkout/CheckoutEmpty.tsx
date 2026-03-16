import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function CheckoutEmpty() {
  return (
    <section className="py-20">
      <div className="container max-w-lg text-center space-y-6">
        <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" />

        <h1 className="text-3xl font-heading font-bold text-foreground">
          Nothing to Checkout
        </h1>

        <p className="text-muted-foreground">
          Your cart is empty. Add products before checkout.
        </p>

        <Link href="/categories">
          <Button variant="hero" size="lg">
            Browse Products
          </Button>
        </Link>
      </div>
    </section>
  );
}
