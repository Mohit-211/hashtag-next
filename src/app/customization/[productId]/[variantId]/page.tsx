import ProductCustomizationPage from "@/components/product/customization/Productcustomizationpage";

interface Props {
  params: Promise<{
    productId: string;
    variantId: string;
  }>;
}

const CustomizeProductPage = async ({ params }: Props) => {
  const { productId, variantId } = await params;

  return (
    <main>
      {/* Keyed so a different product/variant mounts a fresh customizer
          (clean design state, loading skeleton) instead of reusing this one. */}
      <ProductCustomizationPage
        key={`${productId}-${variantId}`}
        productDataId={Number(productId)}
        variantDataId={Number(variantId)}
      />
    </main>
  );
};

export default CustomizeProductPage;