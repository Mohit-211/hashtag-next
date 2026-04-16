"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/common/ProductCard";
import { AllProductsApi } from "@/api/operations/product.api";

interface Product {
  attachments: any;
  id: any;
  _id: string;
  name: string;
  price: number;
  images: string[];
  customizable?: boolean;
}

export default function RelatedProducts({
  category_id,
}: {
  category_id: string | null;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category_id) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);

        const params = {
          category_id: category_id,
          limit: 8,
        };

        const res = await AllProductsApi(params);
        const data = res?.data?.data || [];

        setProducts(data);
      } catch (error) {
        console.error("Error fetching related products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category_id]);

  return (
    <div className="mt-20">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-6">
        Similar Products You May Like
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p>No related products found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              image={product.attachments?.[0]?.file_uri}
              name={product.name}
              price={product.price}
              customizable={product.customizable ?? true}
              productId={Number(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}