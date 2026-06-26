// app/customization/[id]/page.tsx

import ProductCustomizationPage from "@/components/product/customization/Productcustomizationpage";

interface Props {
  params: Promise<{ id: string }>;
}

const CustomizeProductPage = async ({ params }: Props) => {
  const { id } = await params;
  console.log(id, "id")
  return (
    <main>
      <ProductCustomizationPage variantDataId={Number(id)} />
    </main>
  );
};

export default CustomizeProductPage;