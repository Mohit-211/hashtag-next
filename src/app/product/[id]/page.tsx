 import React from "react";
import ProductDetail from "../ProductDetail";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

const ProductDetailsPage = async ({ params }: Props) => {
  const { id } = await params; // ✅ FIX


  return <div>
    <ProductDetail id={id} />
  </div>;
};

export default ProductDetailsPage;