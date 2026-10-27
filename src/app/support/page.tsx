// app/support/Support.tsx

import SupportHeader from "@/components/support/SupportHeader";
import SupportFAQ from "@/components/support/SupportFAQ";
import SupportContactForm from "@/components/support/SupportContactForm";
import SupportInfo from "@/components/support/SupportInfo";
import { publicPage } from "@/lib/seo";

export const metadata = publicPage({
  title: "Support",
  description: "Answers to common questions about orders, customization and shipping, and how to reach our team.",
  path: "/support",
});

export default function Support() {
  return (
    <section className="py-10 lg:py-16">
      <div className="container max-w-4xl">
        <SupportHeader />
        <SupportFAQ />
        <SupportContactForm />
        <SupportInfo />
      </div>
    </section>
  );
}
