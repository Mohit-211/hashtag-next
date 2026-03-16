// components/product/RelatedProducts.tsx

import Link from "next/link";
import ProductCard from "@/components/common/ProductCard";

interface RelatedProduct {
  image: string;
  name: string;
  price: number;
  customizable: boolean;
}

const related: RelatedProduct[] = [
  {
    image: "/assets/product-hoodie.jpg",
    name: "Premium Hoodie",
    price: 1899,
    customizable: true,
  },
  {
    image: "/assets/product-cap.jpg",
    name: "Statement Cap",
    price: 599,
    customizable: true,
  },
  {
    image: "/assets/product-mug.jpg",
    name: "Custom Ceramic Mug",
    price: 449,
    customizable: true,
  },
  {
    image: "/assets/product-tote2.jpg",
    name: "Canvas Tote Bag",
    price: 549,
    customizable: true,
  },
];

export default function RelatedProducts() {
  return (
    <div className="mt-20">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-6">
        Similar Products You May Like
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {related.map((product) => (
          <Link key={product.name} href="/product">
            <ProductCard {...product} />
          </Link>
        ))}
      </div>
    </div>
  );
}
