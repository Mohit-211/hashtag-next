import BrandStory from "@/components/home/BrandStory";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import FinalCTA from "@/components/home/FinalCTA";
import HeroSection from "@/components/home/HeroSection";
import HowItWorks from "@/components/home/HowItWorks";
import WhatWePrint from "@/components/home/WhatWePrint";
import WhoWeServe from "@/components/home/WhoWeServe";
import WhyChooseHB from "@/components/home/WhyChooseHB";


const products = [
  {
    id: "1",
    image: "/assets/product-tshirt.jpg",
    name: "Custom T-Shirt Printing",
    price: 799,
    badge: "POPULAR",
  },
  {
    id: "2",
    image: "/assets/product-hoodie.jpg",
    name: "Premium Hoodie",
    price: 1499,
  },
  {
    id: "3",
    image: "/assets/product-cap.jpg",
    name: "Custom Cap",
    price: 599,
    badge: "NEW",
  },
  {
    id: "4",
    image: "/assets/product-mug.jpg",
    name: "Printed Mug",
    price: 399,
  },
  {
    id: "5",
    image: "/assets/product-tote.jpg",
    name: "Canvas Tote Bag",
    price: 699,
  },
  {
    id: "6",
    image: "/assets/product-phonecase.jpg",
    name: "Custom Phone Case",
    price: 499,
  },
  {
    id: "7",
    image: "/assets/product-socks.jpg",
    name: "Custom Socks",
    price: 349,
  },
  {
    id: "8",
    image: "/assets/product-joggers.jpg",
    name: "Stylish Joggers",
    price: 1199,
  },
];

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <WhatWePrint />
      <HowItWorks />
      {/* <FeaturedProducts products={products} /> */}
      <WhyChooseHB />
      <WhoWeServe/>
      <BrandStory />
      <FinalCTA />
    </>
  );
}