import CategoriesView from "../CategoriesView";

interface CategoriesPageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

/**
 * URL shapes handled by this single catch-all route:
 *
 *   /categories
 *     -> slug is undefined                -> no filter (shows "All")
 *
 *   /categories/brand/12/nike
 *     -> slug = ["brand", "12", "nike"]    -> brand filter
 *
 *   /categories/industry/7/apparel-industry
 *     -> slug = ["industry", "7", "apparel-industry"] -> whole-industry filter
 *        (same mechanism as picking a leaf industry in the sidebar's
 *        Industry facet — see handleIndustrySelect in useCategoriesView)
 *
 *   /categories/12/apparel
 *     -> slug = ["12", "apparel"]          -> grand category filter
 *
 *   /categories/12/apparel/34/shirts
 *     -> slug = ["12", "apparel", "34", "shirts"] -> grand + parent category filter
 */
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