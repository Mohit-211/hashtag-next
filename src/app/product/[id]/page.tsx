import React from "react";
import ProductDetail from "../ProductDetail";

interface Props {
  params: Promise<{ id: string }>;
}

const ProductDetailsPage = async ({ params }: Props) => {
  const { id } = await params;

  return (
    <main>
      <ProductDetail id={id} />
    </main>
  );
};

export default ProductDetailsPage;