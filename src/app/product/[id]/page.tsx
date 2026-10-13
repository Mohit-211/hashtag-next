import ProductDetail from "../ProductDetail";

interface ProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ variant_id?: string }>;
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = await params;
  const { variant_id } = await searchParams;

  return (
    <main>
      {/* Keyed so another product (or variant link) mounts fresh instead of
          carrying over the previous product's selection and modals. */}
      <ProductDetail key={`${id}-${variant_id ?? ""}`} id={id} variantId={variant_id ?? null} />
    </main>
  );
}
