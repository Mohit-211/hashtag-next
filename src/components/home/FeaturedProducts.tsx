import Link from "next/link";
import { ArrowRight } from "lucide-react";

import ProductCard from "@/components/common/ProductCard";
import { Button } from "@/components/ui/button";

type Product = {
  id: string | number;
  image: string;
  name: string;
  price: number;
  badge?: string;
};

interface Props {
  products: Product[];
}

export default function FeaturedProducts({ products }: Props) {
  return (
    <section className="py-20 lg:py-28 bg-secondary">
      <div className="container">

        {/* Header */}
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3">
            Featured
          </p>

          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground leading-tight mb-4">
            Most Loved Products
          </h2>

          <p className="text-base text-muted-foreground leading-relaxed">
            These are some of the most loved and frequently customized products
            chosen by our customers for their versatility and personal
            expression.
          </p>
        </div>

        {/* ✅ Products Grid (FIXED) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              {...p}
              productId={Number(p.id)}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link href="/categories">
            <Button variant="outline" size="lg" className="rounded-lg gap-2">
              View All Products
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}