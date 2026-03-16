// app/privacy-policy/PrivacyPolicy.tsx

const sections = [
  {
    title: "Introduction",
    content:
      "HashtagBillionaire is committed to protecting the privacy of every individual who visits our platform. This Privacy Policy explains how we collect, use, store, and protect your personal information when you browse our website, create an account, place an order, or interact with any of our services. By using our platform, you agree to the practices described in this policy. We encourage you to read this document carefully so you understand how your information is handled.",
  },
  {
    title: "Information We Collect",
    content:
      "We collect information that you provide directly to us, such as your name, email address, phone number, shipping address, and payment details when you create an account or place an order. We also collect information about the products you customize, including uploaded images and placement selections. Additionally, we may automatically collect technical information such as your browser type, device type, IP address, and browsing behavior on our platform to improve your experience and maintain the security of our services.",
  },
  {
    title: "How We Use Information",
    content:
      "The information we collect is used to process and fulfill your orders, manage your account, provide customer support, and communicate important updates about your purchases. We also use this data to improve our platform, personalize your shopping experience, and ensure the quality and reliability of our services. We do not use your personal information for purposes unrelated to our services without your explicit consent.",
  },
  {
    title: "Cookies & Tracking",
    content:
      "Our platform uses cookies and similar tracking technologies to enhance your browsing experience. Cookies help us remember your preferences, keep you logged in, and understand how you interact with our website. You can manage your cookie preferences through your browser settings at any time. Disabling cookies may affect certain features of the platform, but you will still be able to browse and use most of our services.",
  },
  {
    title: "Data Protection",
    content:
      "We take the security of your personal information seriously. We implement industry-standard security measures, including encryption and secure data storage, to protect your information from unauthorized access, alteration, or disclosure. While no method of transmission over the internet is entirely secure, we continuously review and update our security practices to maintain the highest level of protection for your data.",
  },
  {
    title: "Sharing of Information",
    content:
      "We do not sell, rent, or trade your personal information to third parties. We may share your information with trusted service providers who assist us in operating our platform, processing payments, fulfilling orders, and delivering products. These partners are contractually obligated to handle your data responsibly and only for the purposes we specify. We may also disclose information if required by law or to protect the rights and safety of our users and our platform.",
  },
  {
    title: "User Rights",
    content:
      "You have the right to access, update, or delete your personal information at any time through your account settings. You may also request a copy of the data we hold about you or ask us to restrict how we use it. If you wish to close your account or have any concerns about how your information is being handled, please contact our support team and we will address your request promptly.",
  },
  {
    title: "Policy Updates",
    content:
      "We may update this Privacy Policy from time to time to reflect changes in our practices, services, or legal requirements. When we make significant changes, we will notify you through our platform or via email. We encourage you to review this page periodically to stay informed about how we protect your information. Your continued use of our platform after any changes indicates your acceptance of the updated policy.",
  },
  {
    title: "Contact Information",
    content:
      "If you have any questions, concerns, or requests regarding this Privacy Policy or the way we handle your personal information, please reach out to us at privacy@hashtagbillionaire.com. Our team is available to assist you and will respond to all inquiries as promptly as possible.",
  },
];

export default function PrivacyPolicy() {
  return (
    <section className="py-10 lg:py-16">
      <div className="container max-w-2xl space-y-10">
        <div className="space-y-3">
          <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground">
            Privacy Policy
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
