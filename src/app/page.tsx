import HeroSection from "@/components/home/HeroSection";
import BrandIntroduction from "@/components/home/BrandIntroduction";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import CustomizationExperience from "@/components/home/CustomizationExperience";
import CategoriesOverview from "@/components/home/CategoriesOverview";
import TrustSimplicity from "@/components/home/TrustSimplicity";
import FinalCTA from "@/components/home/FinalCTA";

const products = [
  {
    image: "/assets/product-tshirt.jpg",
    name: "Classic Custom Tee",
    price: 799,
    badge: "POPULAR",
  },
  { image: "/assets/product-hoodie.jpg", name: "Premium Hoodie", price: 1899 },
  {
    image: "/assets/product-cap.jpg",
    name: "Statement Cap",
    price: 599,
    badge: "NEW",
  },
  { image: "/assets/product-mug.jpg", name: "Custom Ceramic Mug", price: 449 },
  {
    image: "/assets/product-phonecase.jpg",
    name: "Matte Phone Case",
    price: 699,
  },
  { image: "/assets/product-tote2.jpg", name: "Canvas Tote Bag", price: 549 },
];

const categories = [
  { image: "/assets/cat-apparel.jpg", title: "Apparel", count: 36 },
  { image: "/assets/cat-essentials.jpg", title: "Essentials", count: 18 },
  { image: "/assets/cat-signature.jpg", title: "Signature Items", count: 12 },
  { image: "/assets/cat-custom.jpg", title: "Custom Collection", count: 24 },
];

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <BrandIntroduction />
      <FeaturedProducts products={products} />
      <CustomizationExperience />
      <CategoriesOverview categories={categories} />
      <TrustSimplicity />
      <FinalCTA />
    </>
  );
}
