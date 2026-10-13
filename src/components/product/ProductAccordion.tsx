"use client";

import { useState } from "react";
import { ChevronDown, Truck, FileText, Palette } from "lucide-react";
import DOMPurify from "dompurify";

// `description` is rich text authored in the backend/admin product editor
// and rendered as HTML here — untrusted from the frontend's perspective
// (a compromised admin session or backend bug could inject a payload), so
// it's sanitized with an explicit allowlist rather than DOMPurify's broader
// default. Only the formatting a product description actually needs is
// allowed; DOMPurify's default URI checks already strip javascript:/data:/
// vbscript: schemes from href/src, and disallowing "a"/img "on*" handlers
// via ALLOWED_ATTR removes the rest of the common vectors.
const DESCRIPTION_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "b", "strong", "i", "em", "u", "s", "span",
    "ul", "ol", "li", "h1", "h2", "h3", "h4", "blockquote", "a",
  ],
  ALLOWED_ATTR: ["href", "target", "rel"],
};

// DOMPurify needs a DOM — during server rendering it's an inert stub with no
// addHook/sanitize — so the hook is registered on first use in the browser.
let linkHookRegistered = false;
const sanitizeDescription = (html: string): string => {
  if (!DOMPurify.isSupported) return ""; // server render; descriptions load client-side
  if (!linkHookRegistered) {
    // Any link a product description opens in a new tab gets a safe rel, so the
    // opened page can't reach back into this one via window.opener (tabnabbing).
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      if (node.tagName === "A" && node.getAttribute("target")) {
        node.setAttribute("rel", "noopener noreferrer");
      }
    });
    linkHookRegistered = true;
  }
  return DOMPurify.sanitize(html, DESCRIPTION_SANITIZE_CONFIG);
};

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
          className="text-sm text-muted-foreground leading-7 [&_a]:text-primary-ink [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_h1]:font-semibold [&_h1]:text-foreground [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:font-semibold [&_h3]:text-foreground [&_h4]:font-semibold [&_h4]:text-foreground [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p:not(:last-child)]:mb-3 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{
            __html: sanitizeDescription(description || "No description available"),
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
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />

              <div>
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {item.title}
                </span>
                <span className="text-xs text-muted-foreground">
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
          <p className="text-xs text-muted-foreground bg-muted border border-border rounded-xl px-4 py-3 leading-6">
            Returns accepted only for unworn, unwashed items in
            original packaging. Custom/personalized items are
            non-refundable.
          </p>

          <div className="rounded-xl border border-border bg-card px-4 py-4 space-y-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-foreground">
                Estimated Delivery
              </h4>

              <p className="text-xs text-muted-foreground leading-6 mt-2">
                We strive to ship everything within 10 days,
                but some items may take longer.
              </p>

              <p className="text-xs text-muted-foreground leading-6 mt-2">
                Delivery times may vary due to courier
                schedules, holidays, or remote locations.
              </p>
            </div>

            <div className="pt-3 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-foreground">
                Production Delays
              </h4>

              <p className="text-xs text-muted-foreground leading-6 mt-2">
                Custom production may occasionally face delays
                due to quality checks or machine maintenance.
              </p>

              <p className="text-xs text-muted-foreground leading-6 mt-2">
                If your order is delayed, we will notify you
                immediately with updated timelines.
              </p>

              <p className="text-xs text-muted-foreground leading-6 mt-2">
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
    <div >
      {/* Header */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-ink">
          <span className="w-4 h-px bg-primary" />
          Details
        </span>

        <h2 className="text-2xl font-bold text-foreground mt-2">
          Product Information
        </h2>
      </div>

      {/* Accordion */}
      <div className="border border-border rounded-2xl overflow-hidden bg-card">
        {items.map((item) => {
          const isOpen = open === item.id;

          return (
            <div
              key={item.id}
              className={`transition-colors ${
                isOpen
                  ? "bg-muted"
                  : "bg-card hover:bg-border"
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
                        ? "text-primary-ink"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span
                    className={`text-[14px] font-semibold tracking-wide ${
                      isOpen
                        ? "text-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isOpen
                      ? "bg-foreground text-primary"
                      : "bg-muted text-muted-foreground"
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