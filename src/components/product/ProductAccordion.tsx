"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import DOMPurify from "dompurify";

interface AccordionItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export default function ProductAccordion({
  description,
}: {
  description?: string;
}) {
  const [open, setOpen] = useState<string>("description");

  const items: AccordionItem[] = [
    {
      id: "description",
      label: "Description",
      content: (
        <p
          className="text-sm text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(description || "No description available"),
          }}
        />
      ),
    },
    {
      id: "customization",
      label: "Customization Guide",
      content: (
        <p className="text-sm text-muted-foreground leading-relaxed">
          Upload any image in PNG or JPG format (up to 5 MB). Select one or
          more placement locations — each location adds a small customization
          fee shown beside the option. Your uploaded image will be printed
          using high-quality direct-to-garment (DTG) technology for vivid and
          wash-resistant results. For best results, use images with a minimum
          resolution of 300 DPI and avoid heavily compressed files.
        </p>
      ),
    },
    {
      id: "shipping",
      label: "Shipping & Returns",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Standard Delivery", value: "5–7 business days" },
              { label: "Custom Orders", value: "+2–3 days production" },
              { label: "Free Shipping", value: "Orders above ₹999" },
              { label: "Returns", value: "14 days (non-custom)" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-muted/30 rounded-lg p-3 border border-border"
              >
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-0.5">
                  {item.label}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          <p className="leading-relaxed">
            You will receive a tracking link via email and SMS once your order
            has been shipped. For customized items, returns are not accepted
            unless there is a manufacturing defect.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-14 max-w-3xl">
      <div className="divide-y divide-border border-t border-border">
        {items.map((item) => {
          const isOpen = open === item.id;
          return (
            <div key={item.id}>
              <button
                onClick={() => setOpen(isOpen ? "" : item.id)}
                className="w-full flex items-center justify-between py-4 text-left group"
              >
                <span className="text-sm font-semibold text-foreground group-hover:text-[#2d4a35] transition-colors">
                  {item.label}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${
                    isOpen ? "rotate-180 text-[#2d4a35]" : ""
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen ? "max-h-[600px] pb-5" : "max-h-0"
                }`}
              >
                {item.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}