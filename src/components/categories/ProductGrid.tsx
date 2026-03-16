import ProductCard from "@/components/common/ProductCard";

interface Product {
  image: string;
  name: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  customizable?: boolean;
}

interface Props {
  products: Product[];
}

export default function ProductGrid({ products }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.name} {...product} />
      ))}
    </div>
  );
}
