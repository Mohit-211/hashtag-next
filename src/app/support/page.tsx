// app/support/Support.tsx

import SupportHeader from "@/components/support/SupportHeader";
import SupportFAQ from "@/components/support/SupportFAQ";
import SupportContactForm from "@/components/support/SupportContactForm";
import SupportInfo from "@/components/support/SupportInfo";

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
