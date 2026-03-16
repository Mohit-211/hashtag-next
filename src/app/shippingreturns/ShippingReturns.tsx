import Layout from "@/components/Layout";

const shippingSections = [
  {
    title: "Processing Time",
    content:
      "All orders are processed within one to two business days after payment confirmation. Customized products may require an additional one to two days for preparation, as each item is made to your specifications before being handed over to our shipping partners. You will receive a confirmation email once your order has been dispatched.",
  },
  {
    title: "Standard & Express Shipping",
    content:
      "We offer standard shipping on all orders, with express shipping available at checkout for an additional fee. Standard shipping provides reliable delivery within the estimated timeframe, while express shipping prioritizes your order for faster fulfillment and transit. Both options include tracking so you can monitor your package at every stage.",
  },
  {
    title: "Estimated Delivery",
    content:
      "Standard delivery typically takes five to seven business days depending on your location. Express orders are usually delivered within two to three business days after processing. Please note that delivery times are estimates and may vary due to factors such as courier schedules, holidays, or remote delivery locations.",
  },
  {
    title: "Tracking Availability",
    content:
      "Once your order has been shipped, you will receive a tracking number via email. You can also track your order directly on our website by visiting the Track Order page and entering your Order ID and email address. Real-time status updates are available from the moment your package leaves our facility until it reaches your doorstep.",
  },
  {
    title: "Address Accuracy",
    content:
      "Please ensure that your shipping address is accurate and complete before placing your order. HashtagBillionaire is not responsible for delays or failed deliveries caused by incorrect or incomplete address information. If you need to update your shipping address after placing an order, contact our support team as soon as possible — changes can only be made before the order has been dispatched.",
  },
];

const returnsSections = [
  {
    title: "Eligibility for Returns",
    content:
      "We accept returns on non-customized products within seven days of delivery, provided the items are unused, in their original packaging, and in the same condition as when they were received. To initiate a return, please contact our support team with your Order ID and a brief description of the reason for your request.",
  },
  {
    title: "Conditions for Customized Products",
    content:
      "Due to the personalized nature of customized products, they are generally not eligible for returns or exchanges unless they arrive damaged, defective, or materially different from what was ordered. If you receive a customized item that does not match your specifications, please reach out to our support team within seven days of delivery with photos of the product, and we will work to resolve the issue promptly.",
  },
  {
    title: "Refund Timelines",
    content:
      "Once a return is approved and the product has been received at our facility, refunds are processed within five to seven business days. The refund will be issued to your original payment method. Please allow additional time for the amount to reflect in your account depending on your bank or payment provider. You will receive an email confirmation once the refund has been initiated.",
  },
  {
    title: "Replacement Policy",
    content:
      "If you receive a product that is damaged or defective, we will arrange a replacement at no additional cost. Please contact our support team within seven days of delivery with your Order ID and clear photographs of the issue. Once verified, a replacement will be processed and shipped to you as quickly as possible.",
  },
  {
    title: "Contact for Support",
    content:
      "For any questions or concerns regarding shipping, returns, or refunds, please reach out to our support team at support@hashtagbillionaire.com. You can also visit our Support & Help Center for answers to common questions. We are committed to resolving every inquiry promptly and fairly.",
  },
];

const ShippingReturns = () => {
  return (
    <Layout>
      <section className="py-10 lg:py-16">
        <div className="container max-w-2xl space-y-12">
          <div className="space-y-3">
            <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground">
              Shipping & Returns
            </h1>
            <p className="text-xs text-muted-foreground">Last updated: February 2026</p>
          </div>

          {/* Shipping */}
          <div className="space-y-8">
            <h2 className="text-xl font-heading font-bold text-foreground">Shipping Policy</h2>
            {shippingSections.map((s, i) => (
              <div key={i} className="space-y-2">
                <h3 className="text-base font-heading font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
              </div>
            ))}
          </div>

          <div className="h-px bg-border" />

          {/* Returns */}
          <div className="space-y-8">
            <h2 className="text-xl font-heading font-bold text-foreground">Returns & Refund Policy</h2>
            {returnsSections.map((s, i) => (
              <div key={i} className="space-y-2">
                <h3 className="text-base font-heading font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
              </div>
            ))}
          </div>

          <div className="h-px bg-border" />

          {/* Closing */}
          <div className="space-y-3">
            <h2 className="text-xl font-heading font-bold text-foreground">Our Commitment</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              At HashtagBillionaire, we believe in complete transparency when it comes to shipping
              and returns. Every policy is designed to be fair, straightforward, and easy to
              understand. If anything is unclear or if you need assistance at any point, our support
              team is always here to help. Your satisfaction and trust are at the center of
              everything we do.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ShippingReturns;
