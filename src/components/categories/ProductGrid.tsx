import ProductCard from "@/components/common/ProductCard";

interface Product {
  attachments: any;
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
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product, index) => {
        const imageUrl = product.attachments?.[0]?.file_uri;

        return (
          <ProductCard
            key={index}
            {...product}
            image={imageUrl}
            productId={Number(product.id)}
          />
        );
      })}
    </div>
  );
}