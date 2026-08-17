import CategoriesView from "../CategoriesView";

interface CategoriesPageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { slug = [] } = await params;

  // ── /categories/brand/[brandId]/[brandSlug] ──────────────────────────────
  if (slug[0] === "brand") {
    const [, brandId, brandSlug] = slug;

    return (
      <CategoriesView
        initialBrandId={brandId}
        initialBrandSlug={brandSlug}
      />
    );
  }

  // ── /categories/industry/[industryId]/[industrySlug] ────────────────────
  if (slug[0] === "industry") {
    const [, industryId, industrySlug] = slug;

    return (
      <CategoriesView
        initialIndustryId={industryId}
        initialIndustrySlug={industrySlug}
      />
    );
  }

  // ── /categories  (no slug at all) ────────────────────────────────────────
  if (slug.length === 0) {
    return <CategoriesView />;
  }

  // ── /categories/[categoryId]/[categorySlug] ──────────────────────────────
  // ── /categories/[categoryId]/[categorySlug]/[parentId]/[parentSlug] ─────
  const [categoryId, categorySlug, parentId, parentSlug] = slug;

  return (
    <CategoriesView
      initialCategoryId={categoryId}
      initialCategorySlug={categorySlug}
      initialParentId={parentId}
      initialParentSlug={parentSlug}
    />
  );
}