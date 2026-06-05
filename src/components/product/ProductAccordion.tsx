"use client";

import { useState } from "react";
import { ChevronDown, Truck, FileText, Palette } from "lucide-react";
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
          className="text-sm text-[#6B7280] leading-7 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              description || "No description available"
            ),
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
            {
              title: "File format",
              detail: "PNG or JPG, maximum 5MB",
            },
            {
              title: "Resolution",
              detail: "Minimum 300 DPI for crisp results",
            },
            {
              title: "Print method",
              detail: "High-quality DTG (Direct to Garment)",
            },
            {
              title: "Placement",
              detail:
                "Front, back, or sleeve — extra cost may apply",
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#CFAF2E] mt-2 flex-shrink-0" />

              <div>
                <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                  {item.title}
                </span>
                <span className="text-xs text-[#6B7280]">
                  {" "}
                  — {item.detail}
                </span>
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
          <p className="text-xs text-[#6B7280] bg-[#f5f5f5] border border-[#E5E5E5] rounded-xl px-4 py-3 leading-6">
            Returns accepted only for unworn, unwashed items in
            original packaging. Custom/personalized items are
            non-refundable.
          </p>

          <div className="rounded-xl border border-[#E5E5E5] bg-white px-4 py-4 space-y-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-[#111111]">
                Estimated Delivery
              </h4>

              <p className="text-xs text-[#6B7280] leading-6 mt-2">
                We strive to ship everything within 10 days,
                but some items may take longer.
              </p>

              <p className="text-xs text-[#6B7280] leading-6 mt-2">
                Delivery times may vary due to courier
                schedules, holidays, or remote locations.
              </p>
            </div>

            <div className="pt-3 border-t border-[#E5E5E5]">
              <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-[#111111]">
                Production Delays
              </h4>

              <p className="text-xs text-[#6B7280] leading-6 mt-2">
                Custom production may occasionally face delays
                due to quality checks or machine maintenance.
              </p>

              <p className="text-xs text-[#6B7280] leading-6 mt-2">
                If your order is delayed, we will notify you
                immediately with updated timelines.
              </p>

              <p className="text-xs text-[#6B7280] leading-6 mt-2">
                We never ship anything that does not meet our
                quality standards.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-16 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#CFAF2E]">
          <span className="w-4 h-px bg-[#CFAF2E]" />
          Details
        </span>

        <h2 className="text-2xl font-bold text-[#111111] mt-2">
          Product Information
        </h2>
      </div>

      {/* Accordion */}
      <div className="border border-[#E5E5E5] rounded-2xl overflow-hidden bg-white">
        {items.map((item) => {
          const isOpen = open === item.id;

          return (
            <div
              key={item.id}
              className={`transition-colors ${
                isOpen
                  ? "bg-[#f5f5f5]"
                  : "bg-white hover:bg-[#FAFAFA]"
              }`}
            >
              <button
                onClick={() =>
                  setOpen(isOpen ? "" : item.id)
                }
                className="w-full flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`transition-colors ${
                      isOpen
                        ? "text-[#CFAF2E]"
                        : "text-[#6B7280]"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span
                    className={`text-[14px] font-semibold tracking-wide ${
                      isOpen
                        ? "text-[#111111]"
                        : "text-[#111111]"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isOpen
                      ? "bg-[#111111] text-[#E8D03A]"
                      : "bg-[#F5F5F5] text-[#6B7280]"
                  }`}
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Content */}
              <div
                className={`grid transition-all duration-300 ${
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden px-5 pb-5">
                  {item.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}