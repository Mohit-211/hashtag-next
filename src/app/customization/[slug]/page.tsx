import ProductCustomizationPage from "@/components/product/customization/Productcustomizationpage";
import React from "react";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    productId?: string;
    variantId?: string;
    price?: string;
    name?: string;
    image?: string;
  }>;
}

const CustomizeProductPage = async ({ params, searchParams }: Props) => {
  const { slug } = await params;
  const { productId, variantId, price, name, image } = await searchParams;

  // Graceful guard — if params are missing redirect or show error via the client component
  return (
    <main>
      <ProductCustomizationPage
        slug={slug}
        productId={productId ? Number(productId) : null}
        variantId={variantId ? Number(variantId) : null}
        price={price ? Number(price) : null}
        name={name ?? null}
        productImage={image ?? null}
      />
    </main>
  );
};

export default CustomizeProductPage;