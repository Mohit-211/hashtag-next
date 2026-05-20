"use client";

import { useState } from "react";
import { ChevronDown, Truck, RotateCcw, Package, FileText, Palette } from "lucide-react";
import DOMPurify from "dompurify";

interface AccordionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
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
      icon: <FileText className="w-4 h-4" />,
      content: (
        <div
          className="text-sm text-[#6b8070] leading-relaxed prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(description || "No description available"),
          }}
        />
      ),
    },
    {
      id: "customization",
      label: "Customization Guide",
      icon: <Palette className="w-4 h-4" />,
      content: (
        <div className="space-y-3">
          {[
            { title: "File format", detail: "PNG or JPG, maximum 5MB" },
            { title: "Resolution", detail: "Minimum 300 DPI for crisp results" },
            { title: "Print method", detail: "High-quality DTG (Direct to Garment)" },
            { title: "Placement", detail: "Front, back, or sleeve — extra cost may apply" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4a7a58] mt-2 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-[#2d4a35] uppercase tracking-wider">{item.title} </span>
                <span className="text-xs text-[#6b8070]">— {item.detail}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "shipping",
      label: "Shipping & Returns",
      icon: <Truck className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {/* <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: <Package className="w-3.5 h-3.5" />, label: "Standard Delivery", value: "5–7 business days" },
              { icon: <Truck className="w-3.5 h-3.5" />, label: "Custom Orders", value: "+2–3 extra days" },
              { icon: <Package className="w-3.5 h-3.5" />, label: "Free Shipping", value: "Orders above $999" },
              { icon: <RotateCcw className="w-3.5 h-3.5" />, label: "Returns", value: "14-day window" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-3.5 bg-[#f0f6f1] border border-[#dde8df] space-y-2"
              >
                <div className="flex items-center gap-1.5 text-[#4a7a58]">
                  {item.icon}
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[#8fa989]">
                    {item.label}
                  </p>
                </div>
                <p className="font-bold text-sm text-[#1a2e1f]">{item.value}</p>
              </div>
            ))}
          </div> */}
          <div className="space-y-3">
  <p className="text-xs text-[#8fa989] bg-[#faf9f7] border border-[#e8e4df] rounded-xl px-4 py-3 leading-6">
    Returns accepted only for unworn, unwashed items in original packaging.
    Custom/personalized items are non-refundable.
  </p>

  <div className="rounded-xl border border-[#dde8df] bg-[#f7faf8] px-4 py-4 space-y-3">
    <div>
      <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-[#2d4a35]">
        Estimated Delivery
      </h4>

      <p className="text-xs text-[#6b8070] leading-6 mt-2">
        We strive to ship everything within 10 days, but some items may take
        longer.
      </p>

      <p className="text-xs text-[#6b8070] leading-6 mt-2">
        Please note that delivery times are estimates and may vary due to
        factors such as courier schedules, holidays, or remote delivery
        locations.
      </p>
    </div>

    <div className="pt-3 border-t border-[#dde8df]">
      <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-[#2d4a35]">
        Production Variability & Unexpected Delays
      </h4>

      <p className="text-xs text-[#6b8070] leading-6 mt-2">
        Because many of our products are custom-made, occasional production
        delays may occur.
      </p>

      <p className="text-xs text-[#6b8070] leading-6 mt-2">
        Factors such as machine maintenance, needle breaks, garment defects,
        or the need to re-run an item to meet our quality standards can
        extend the normal processing timeline.
      </p>

      <p className="text-xs text-[#6b8070] leading-6 mt-2">
        These situations are rare, but they are a natural part of custom
        apparel production.
      </p>

      <p className="text-xs text-[#6b8070] leading-6 mt-2">
        If your order is affected by an unexpected production delay, our
        team will notify you promptly with an updated timeline.
      </p>

      <p className="text-xs text-[#6b8070] leading-6 mt-2">
        We are committed to delivering high-quality products and will never
        ship an item that does not meet our standards.
      </p>
    </div>
  </div>
</div>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-16 max-w-3xl">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4a7a58]">
          <span className="w-3 h-px bg-[#4a7a58] inline-block" />
          Details
        </span>
        <h2 className="font-heading text-xl font-bold text-[#1a2e1f] mt-1">
          Product Information
        </h2>
      </div>

      <div className="divide-y divide-[#ece8e2] border-t border-[#ece8e2] border-b rounded-2xl overflow-hidden bg-white shadow-sm">
        {items.map((item) => {
          const isOpen = open === item.id;

          return (
            <div key={item.id} className={isOpen ? "bg-[#faf9f7]" : "bg-white hover:bg-[#faf9f7]/60 transition-colors"}>
              <button
                onClick={() => setOpen(isOpen ? "" : item.id)}
                className="w-full flex items-center justify-between px-5 py-4 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className={`transition-colors duration-200 ${isOpen ? "text-[#2d4a35]" : "text-[#8fa989]"}`}>
                    {item.icon}
                  </span>
                  <span className={`text-[14px] font-semibold tracking-wide transition-colors duration-200 ${
                    isOpen ? "text-[#2d4a35]" : "text-[#1a2e1f]"
                  }`}>
                    {item.label}
                  </span>
                </div>

                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isOpen ? "bg-[#2d4a35] text-white" : "bg-[#f0f0ed] text-[#8fa989]"
                }`}>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              <div
                className={`grid transition-all duration-300 ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5">{item.content}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
