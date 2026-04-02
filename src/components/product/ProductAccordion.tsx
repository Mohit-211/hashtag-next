// components/product/ProductAccordion.tsx

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ProductAccordion({ description }: { description?: string }) {
  return (
    <div className="mt-16 max-w-3xl">
      <Accordion type="single" collapsible defaultValue="description">
        <AccordionItem value="description">
          <AccordionTrigger className="text-base font-heading font-semibold">
            Description
          </AccordionTrigger>

          <AccordionContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="customization">
          <AccordionTrigger className="text-base font-heading font-semibold">
            Customization Guide
          </AccordionTrigger>

          <AccordionContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload any image in PNG or JPG format (up to 5 MB). Select one or
              more placement locations — each location adds a small
              customization fee shown beside the option. Your uploaded image
              will be printed using high-quality direct-to-garment (DTG)
              technology for vivid and wash-resistant results. For best results,
              use images with a minimum resolution of 300 DPI and avoid heavily
              compressed files.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="shipping">
          <AccordionTrigger className="text-base font-heading font-semibold">
            Shipping Info
          </AccordionTrigger>

          <AccordionContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Standard shipping takes 5–7 business days across India. Customized
              orders require an additional 2–3 days for production before
              dispatch. Free shipping is available on all orders above $999. You
              will receive a tracking link via email and SMS once your order has
              been shipped.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
