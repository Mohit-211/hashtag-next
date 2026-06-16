// app/customization/[id]/page.tsx

import ProductCustomizationPage from "@/components/product/customization/Productcustomizationpage";

interface Props {
  params: Promise<{ id: string }>;
}

const CustomizeProductPage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <ProductCustomizationPage productId={Number(id)} />
    </main>
  );
};

export default CustomizeProductPage;