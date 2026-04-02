"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/common/ProductCard";
import { AllProductsApi } from "@/api/operations/product.api";

interface Product {
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
          limit: 8, // optional
        };

        const res = await AllProductsApi(params);
        // ✅ adjust based on your API response structure
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
  const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL;

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

            <Link key={product.id} href={`/product/${product.id}`}>
              <ProductCard
                image={`${BASE_IMAGE_URL}${(product as any)?.attachments?.[0]?.file_name}`}

                name={product.name}
                price={product.price}
                customizable={product.customizable ?? true}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}