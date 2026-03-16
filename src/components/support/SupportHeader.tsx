// components/support/SupportHeader.tsx

import Image from "next/image";

export default function SupportHeader() {
  return (
    <div className="text-center mb-12 space-y-4">
      <Image
        src="/assets/support-hero.jpg"
        alt="Support illustration"
        width={96}
        height={96}
        className="h-24 w-24 mx-auto object-contain rounded-xl"
      />

      <h1 className="text-3xl lg:text-4xl font-heading font-bold">
        Support & Help Center
      </h1>

      <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mx-auto">
        Find answers to common questions about orders, customization, shipping,
        and payments. If you need further assistance, our support team is ready
        to help.
      </p>
    </div>
  );
}
