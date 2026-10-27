import BrandStory from "@/components/home/BrandStory";
import FinalCTA from "@/components/home/FinalCTA";
import HeroSection from "@/components/home/HeroSection";
import HowItWorks from "@/components/home/HowItWorks";
import WhatWePrint from "@/components/home/WhatWePrint";
import WhoWeServe from "@/components/home/WhoWeServe";
import WhyChooseHB from "@/components/home/WhyChooseHB";
import { publicPage } from "@/lib/seo";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata = publicPage({
  description: SITE_DESCRIPTION,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <WhatWePrint />
      <HowItWorks />
      <WhyChooseHB />
      <WhoWeServe />
      <BrandStory />
      <FinalCTA />
    </>
  );
}
