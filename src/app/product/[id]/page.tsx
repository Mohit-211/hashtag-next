import type { Metadata } from "next";
import ProductDetail from "../ProductDetail";
import { resolveImageSrc } from "@/lib/images";
import { fetchPublicJson } from "@/lib/publicApi";
import { baseOpenGraph, decodeEntities, toMetaDescription } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

interface ProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ variant_id?: string }>;
}

/** The fields of GET product/guest/:id the page's metadata uses. */
interface ProductSeo {
  name?: string;
  description?: string | null;
  brand?: { name?: string | null } | null;
  attachments?: { file_uri?: string | null; is_primary?: boolean }[];
}

// Server-rendered title, description and share image, so search results and
// link previews show the product rather than the site's defaults. Variant
// links (?variant_id=) all point at the one product URL.
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const canonical = `/product/${encodeURIComponent(id)}`;
  const res = await fetchPublicJson<{ data?: ProductSeo }>(`product/guest/${encodeURIComponent(id)}`);
  const product = res?.data;
  if (!product?.name) return { title: "Product", alternates: { canonical } };

  const name = decodeEntities(product.name);
  const brand = product.brand?.name ? decodeEntities(product.brand.name) : null;
  const description =
    toMetaDescription(product.description) ?? `${name}${brand ? ` by ${brand}` : ""}. Order online from ${SITE_NAME}.`;
  const attachment = product.attachments?.find((a) => a.is_primary) ?? product.attachments?.[0];
  const image = attachment?.file_uri ? resolveImageSrc(attachment.file_uri) : null;

  return {
    title: name,
    description,
    alternates: { canonical },
    openGraph: {
      ...baseOpenGraph,
      url: canonical,
      title: `${name} | ${SITE_NAME}`,
      description,
      images: image?.startsWith("http") ? [{ url: image, alt: name }] : baseOpenGraph.images,
    },
  };
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
