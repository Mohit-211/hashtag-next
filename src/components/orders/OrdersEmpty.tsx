// components/orders/OrdersEmpty.tsx

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function OrdersEmpty() {
  return (
    <section className="py-20">
      <div className="container max-w-lg text-center space-y-6">
        <Image
          src="/assets/empty-orders.jpg"
          alt="No orders"
          width={128}
          height={128}
          className="w-32 h-32 mx-auto object-contain"
        />

        <h1 className="text-3xl font-heading font-bold">No Orders Yet</h1>

        <p className="text-muted-foreground">
          When you place orders they will appear here.
        </p>

        <Link href="/categories">
          <Button variant="hero" size="lg" className="gap-2">
            <ShoppingBag className="h-5 w-5" />
            Browse Products
          </Button>
        </Link>
      </div>
    </section>
  );
}
