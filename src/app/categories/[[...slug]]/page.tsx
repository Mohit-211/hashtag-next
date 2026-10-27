import type { Metadata } from "next";
import CategoriesView from "../CategoriesView";
import { publicPage, titleFromSlug } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

interface CategoriesPageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

// Titled from the URL itself (no API call). The canonical drops the query
// string, so filtered and sorted views all point at the page they refine.
export async function generateMetadata({ params }: CategoriesPageProps): Promise<Metadata> {
  const { slug = [] } = await params;
  const path = slug.length ? `/categories/${slug.map(encodeURIComponent).join("/")}` : "/categories";
  const [first, second, third, fourth] = slug;
  const title =
    first === "brand" || first === "industry"
      ? titleFromSlug(third) || (first === "brand" ? "Brand" : "Industry")
      : titleFromSlug(fourth ?? second) || "All Products";

  return publicPage({ title, description: `Browse ${title} at ${SITE_NAME} and order online.`, path });
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