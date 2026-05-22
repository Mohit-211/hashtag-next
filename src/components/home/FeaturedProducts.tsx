import ProductCard from "@/components/common/ProductCard";

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

        <div className="max-w-2xl mb-10">

          <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3">
            FEATURED
          </p>

          <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
            Popular Print Products
          </h2>

          <p className="text-muted-foreground leading-relaxed">
            Explore our most popular printing products
            trusted by businesses and creators.
          </p>

        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              {...p}
              productId={Number(p.id)}
            />
          ))}
        </div>

      </div>
    </section>
  );
}