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
      <ProductCustomizationPage
        productDataId={Number(productId)}
        variantDataId={Number(variantId)}
      />
    </main>
  );
};

export default CustomizeProductPage;