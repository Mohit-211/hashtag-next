import ConciergeSourcingSection from '@/components/conatctUs/Conciergesourcingsection'
import React from 'react'
import { publicPage } from "@/lib/seo";

export const metadata = publicPage({
  title: "Contact Us",
  description: "Can't find what you need? Our concierge sourcing team finds it and follows up with a custom mockup deck.",
  path: "/contact-us",
});

const ContactUsPage = () => {
  return (
    <div className="bg-surface">
      <div className="container py-14 lg:py-20">
        <ConciergeSourcingSection />
      </div>

    </div>
  )
}

export default ContactUsPage