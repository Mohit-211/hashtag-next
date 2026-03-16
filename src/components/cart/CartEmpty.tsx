import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function CartEmpty() {
  return (
    <section className="py-20">
      <div className="container max-w-lg text-center space-y-6">
        <Image
          src="/assets/empty-cart.jpg"
          alt="Empty cart"
          width={192}
          height={192}
          className="w-48 h-48 mx-auto object-contain opacity-80"
        />

        <h1 className="text-3xl font-heading font-bold text-foreground">
          Your Cart is Empty
        </h1>

        <p className="text-base text-muted-foreground leading-relaxed">
          Your cart is currently empty. Explore products and create something
          uniquely yours.
        </p>

        <Button
          asChild
          variant="hero"
          size="lg"
          className="rounded-lg gap-2 mt-2"
        >
          <Link href="/categories">
            <ShoppingBag className="h-5 w-5" />
            Browse Products
          </Link>
        </Button>
      </div>
    </section>
  );
}
