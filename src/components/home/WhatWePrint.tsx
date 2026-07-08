import Link from "next/link";
import CategoryCard from "@/components/common/CategoryCard";

// ─────────────────────────────────────────────────────────────────────────────
// Static hrefs — set each to the real /categories/[id]/[slug] URL from your
// backend (same ids CategoriesView.tsx uses). Edit these directly, no
// id/slug computation needed.
// ─────────────────────────────────────────────────────────────────────────────

const categories = [
  {
    href: "/categories/6/apparel-and-uniforms", // ⚠️ confirm/replace
    image: "/assets/HomeImage/apparel.png",
    title: "Apparel Printing",
    count: 24,
  },
  {
    href: "/categories/1/business-cards", // ⚠️ replace with real id
    image: "/assets/HomeImage/business cards.png",
    title: "Business Cards",
    count: 12,
  },
  {
    href: "/categories/2/marketing-materials/20/flyers", // ⚠️ replace with real id
    image: "/assets/HomeImage/flyers.png",
    title: "Flyers & Brochures",
    count: 18,
  },
  {
    href: "/categories/4/signs-and-banners", // ⚠️ replace with real id
    image: "/assets/HomeImage/banners.png",
    title: "Banners & Signs",
    count: 9,
  },
  {
    href: "/categories/5/labels-and-stickers", // ⚠️ replace with real id
    image: "/assets/HomeImage/stickers.png",
    title: "Stickers & Labels",
    count: 14,
  },
  {
    href: "/categories/7/promo-products", // ⚠️ replace with real id
    image: "/assets/HomeImage/promo item.png",
    title: "Promo Items",
    count: 11,
  },
  // {
  //   href: "/categories/9/business-boxes", // ⚠️ confirm/replace
  //   image: "/assets/HomeImage/trade show displays.png",
  //   title: "Trade Show Displays",
  //   count: 6,
  // },
];

export default function WhatWePrint() {
  return (
    <section className="py-20 lg:py-28 bg-secondary">
      <div className="container">

        <div className="max-w-2xl mb-10">
          <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3">
            WHAT WE PRINT
          </p>

          <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
            Print Solutions for Every Need
          </h2>

          <p className="text-muted-foreground leading-relaxed">
            From apparel and marketing materials to event displays and
            promotional products — we provide high-quality printing
            tailored for businesses, creators, and organizations.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat) => (
            <Link key={cat.title} href={cat.href}>
              <CategoryCard
        image={cat.image}
        title={cat.title}
        count={cat.count}
      />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}