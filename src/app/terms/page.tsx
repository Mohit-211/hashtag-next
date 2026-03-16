// app/terms/Terms.tsx

const sections = [
  {
    title: "Introduction",
    content:
      "Welcome to HashtagBillionaire. These Terms and Conditions govern your use of our website, services, and products. By accessing or using our platform, you agree to be bound by these terms in their entirety. If you do not agree with any part of these terms, please do not use our services. We recommend reading this document carefully before making any purchases or creating an account.",
  },
  {
    title: "Use of Website",
    content:
      "You may use our website for lawful purposes only. You agree not to misuse the platform, interfere with its operation, or attempt to gain unauthorized access to any part of our systems. We reserve the right to restrict or terminate access to any user who violates these terms or engages in conduct that we consider harmful to the platform, other users, or our business operations.",
  },
  {
    title: "Account Responsibility",
    content:
      "When you create an account on HashtagBillionaire, you are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to provide accurate and up-to-date information during registration and to notify us immediately if you suspect any unauthorized use of your account. We are not liable for any loss or damage arising from your failure to protect your account information.",
  },
  {
    title: "Orders & Payments",
    content:
      "All orders placed on our platform are subject to availability and confirmation. Prices are displayed in the applicable currency and include any relevant taxes unless stated otherwise. Payment must be completed at the time of order placement using one of our accepted payment methods. We reserve the right to cancel or refuse any order if we detect fraudulent activity, pricing errors, or stock unavailability.",
  },
  {
    title: "Customization Policy",
    content:
      "HashtagBillionaire offers product customization features including image uploads and placement selection. By uploading content, you confirm that you own the rights to the material or have obtained the necessary permissions to use it. We reserve the right to reject any content that we consider inappropriate, offensive, or in violation of intellectual property rights. Customized products are made to order and may be subject to specific return and refund conditions as outlined in the relevant section below.",
  },
  {
    title: "Intellectual Property",
    content:
      "All content on our platform, including but not limited to text, images, graphics, logos, and software, is the property of HashtagBillionaire or its licensors and is protected by applicable intellectual property laws. You may not reproduce, distribute, modify, or create derivative works from any content on our platform without prior written permission. Any content you upload for customization purposes remains your property, but you grant us a limited license to use it solely for the purpose of fulfilling your order.",
  },
  {
    title: "Returns & Refunds",
    content:
      "We want you to be satisfied with every purchase. If you receive a defective or incorrect product, please contact our support team within seven days of delivery to initiate a return or exchange. Customized products may only be returned if they arrive damaged or materially different from what was ordered. Refunds, when approved, will be processed to the original payment method within a reasonable timeframe. Detailed return instructions will be provided by our support team upon request.",
  },
  {
    title: "Limitation of Liability",
    content:
      "HashtagBillionaire shall not be held liable for any indirect, incidental, or consequential damages arising from the use of our platform or products. Our total liability in connection with any claim shall not exceed the amount you paid for the specific product or service in question. We do not guarantee uninterrupted or error-free access to our platform and are not responsible for delays or failures caused by circumstances beyond our reasonable control.",
  },
  {
    title: "Changes to Terms",
    content:
      "We may update these Terms and Conditions from time to time to reflect changes in our services, legal requirements, or business practices. When significant changes are made, we will notify users through the platform or via email. Your continued use of our services after any modifications constitutes acceptance of the updated terms. We encourage you to review this page periodically to stay informed.",
  },
  {
    title: "Governing Law",
    content:
      "These Terms and Conditions are governed by and construed in accordance with the laws of the jurisdiction in which HashtagBillionaire operates. Any disputes arising from or related to these terms shall be resolved through the appropriate legal channels within that jurisdiction. By using our platform, you consent to the exclusive jurisdiction of the applicable courts.",
  },
  {
    title: "Contact",
    content:
      "If you have any questions or concerns about these Terms and Conditions, please contact us at legal@hashtagbillionaire.com. Our team is available to clarify any aspect of these terms and will respond to inquiries as promptly as possible.",
  },
];

export default function Terms() {
  return (
    <section className="py-10 lg:py-16">
      <div className="container max-w-2xl space-y-10">
        <div className="space-y-3">
          <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground">
            Terms & Conditions
          </h1>
          <p className="text-xs text-muted-foreground">
            Last updated: February 2026
          </p>
        </div>

        {sections.map((section, i) => (
          <div key={i} className="space-y-3">
            <h2 className="text-lg font-heading font-semibold text-foreground">
              {i + 1}. {section.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
