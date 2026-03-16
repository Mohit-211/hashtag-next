import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";


import BrandIntroduction from "@/components/home/BrandIntroduction"
import FeaturedProducts from "@/components/home/FeaturedProducts"
import CustomizationExperience from "@/components/home/CustomizationExperience"
import TrustSimplicity from "@/components/home/TrustSimplicity"
import FinalCTA from "@/components/home/FinalCTA"



import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import brandShowcase from "@/assets/brand-showcase.jpg";
import customizationUi from "@/assets/customization-ui.jpg";

import productTshirt from "@/assets/product-tshirt.jpg";
import productHoodie from "@/assets/product-hoodie.jpg";
import productCap from "@/assets/product-cap.jpg";
import productMug from "@/assets/product-mug.jpg";
import productPhonecase from "@/assets/product-phonecase.jpg";
import productTote2 from "@/assets/product-tote2.jpg";

import catApparel from "@/assets/cat-apparel.jpg";
import catEssentials from "@/assets/cat-essentials.jpg";
import catSignature from "@/assets/cat-signature.jpg";
import catCustom from "@/assets/cat-custom.jpg";

const products = [
  {
    image: productTshirt,
    name: "Classic Custom Tee",
    price: 799,
    badge: "POPULAR",
  },
  { image: productHoodie, name: "Premium Hoodie", price: 1899 },
  { image: productCap, name: "Statement Cap", price: 599, badge: "NEW" },
  { image: productMug, name: "Custom Ceramic Mug", price: 449 },
  { image: productPhonecase, name: "Matte Phone Case", price: 699 },
  { image: productTote2, name: "Canvas Tote Bag", price: 549 },
];

const categories = [
  { image: catApparel, title: "Apparel", count: 36 },
  { image: catEssentials, title: "Essentials", count: 18 },
  { image: catSignature, title: "Signature Items", count: 12 },
  { image: catCustom, title: "Custom Collection", count: 24 },
];

const Index = () => {
  return (
    <Layout>
      {/* 1. Hero */}
      <HeroSection />

      
      
export default Index;
