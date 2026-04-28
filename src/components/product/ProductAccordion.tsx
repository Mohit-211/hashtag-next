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
          Upload PNG/JPG (max 5MB). Choose placement areas (extra cost applies).
          Printed using high-quality DTG for long-lasting results. Use 300 DPI images.
        </p>
      ),
    },
    {
      id: "shipping",
      label: "Shipping & Returns",
      content: (
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Standard Delivery", value: "5–7 days" },
              { label: "Custom Orders", value: "+2–3 days" },
              { label: "Free Shipping", value: "Above ₹999" },
              { label: "Returns", value: "14 days" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-3 border bg-muted/20 hover:bg-muted/40 transition"
              >
                <p className="text-[11px] uppercase text-muted-foreground/60">
                  {item.label}
                </p>
                <p className="font-medium text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-20 max-w-3xl">
      <div className="divide-y border-t">
        {items.map((item) => {
          const isOpen = open === item.id;

          return (
            <div key={item.id}>
              <button
                onClick={() => setOpen(isOpen ? "" : item.id)}
                className={`w-full flex justify-between py-5 transition-all duration-300 ${
                  isOpen ? "text-[#2d4a35]" : ""
                }`}
              >
                <span className="text-[15px] font-semibold tracking-wide">
                  {item.label}
                </span>

                <ChevronDown
                  className={`w-4 h-4 transition-all duration-300 ${
                    isOpen ? "rotate-180 text-[#2d4a35]" : ""
                  }`}
                />
              </button>

              {/* Smooth animation */}
              <div
                className={`grid transition-all duration-300 ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden pb-4">{item.content}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}