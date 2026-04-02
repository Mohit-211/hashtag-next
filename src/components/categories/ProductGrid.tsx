import Link from "next/link";
import ProductCard from "@/components/common/ProductCard";

interface Product {
  id: string | number;
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
  const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product, index) => {
        const imageUrl = `${BASE_IMAGE_URL}${(product as any)?.attachments?.[0]?.file_name}`;

        return (
          <Link href={`/product/${product.id}`} key={index}>
            <ProductCard
              {...product}
              image={imageUrl}
            />
          </Link>
        );
      })}
    </div>
  );
}