"use client";

import { Check, ChevronDown } from "lucide-react";

export type OptionDisplayStyle = "dropdown" | "radio" | "checkbox" | "buttons" | "color";

export interface OptionGroupValue {
  value: string;
  available: boolean;
}

const DISPLAY_STYLES: OptionDisplayStyle[] = ["dropdown", "radio", "checkbox", "buttons", "color"];

// Spelling variants the backend may send ("Button", "radio_button", "swatch" …).
const STYLE_ALIASES: Record<string, OptionDisplayStyle> = {
  button: "buttons",
  select: "dropdown",
  radiobutton: "radio",
  radios: "radio",
  checkboxes: "checkbox",
  colour: "color",
  colors: "color",
  swatch: "color",
  swatches: "color",
  colorswatch: "color",
};

/** Unknown or missing display_style values fall back to a dropdown. */
export const resolveDisplayStyle = (raw?: string | null): OptionDisplayStyle => {
  const key = String(raw ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (DISPLAY_STYLES.includes(key as OptionDisplayStyle)) return key as OptionDisplayStyle;
  return STYLE_ALIASES[key] ?? "dropdown";
};

const cssColor = (value: string) =>
  typeof CSS !== "undefined" && CSS.supports("color", value.toLowerCase()) ? value.toLowerCase() : null;

const buttonClass = (isActive: boolean, available: boolean) =>
  `min-w-[52px] px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all duration-200 inline-flex items-center justify-center gap-2 ${isActive
    ? "bg-foreground text-primary border-foreground"
    : available
      ? "bg-card text-foreground border-border hover:border-primary hover:bg-primary-soft"
      : "bg-muted text-muted-foreground border-border cursor-not-allowed line-through"
  }`;

/**
 * One product option group (Pages / Size / Color …). The `type` is only the
 * label — the control itself is chosen by the backend's `display_style`.
 * Selection is always single-valued per group because it resolves to a variant.
 */
export default function ProductOptionGroup({
  name,
  values,
  displayStyle,
  selected,
  onChange,
}: {
  name: string;
  values: OptionGroupValue[];
  displayStyle?: string | null;
  selected?: string;
  onChange?: (value: string) => void;
}) {
  const style = resolveDisplayStyle(displayStyle);
  const pick = (value: string, available: boolean) => {
    if (available && value !== selected) onChange?.(value);
  };
  const inputName = `option-${name.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    // Dropdowns sit side by side in the parent grid; wider controls take the full row.
    <div className={style === "dropdown" ? "min-w-0" : "col-span-full"}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground truncate">{name}</p>
        {style !== "dropdown" && (
          <p className="text-sm font-semibold text-foreground truncate">
            {selected || `Select ${name.toLowerCase()}`}
          </p>
        )}
      </div>

      {style === "dropdown" && (
        <div className="relative w-full">
          <select
            aria-label={name}
            value={selected ?? ""}
            onChange={(e) => {
              const opt = values.find((v) => v.value === e.target.value);
              if (opt) pick(opt.value, opt.available);
            }}
            className="w-full h-11 appearance-none truncate rounded-lg border border-border bg-card pl-3 sm:pl-4 pr-9 text-sm font-semibold text-foreground outline-none transition-colors hover:border-primary focus:border-primary cursor-pointer"
          >
            {!selected && (
              <option value="" disabled>
                {`Select ${name.toLowerCase()}`}
              </option>
            )}
            {values.map(({ value, available }) => (
              <option key={value} value={value} disabled={!available}>
                {available ? value : `${value} (unavailable)`}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      )}

      {(style === "radio" || style === "checkbox") && (
        <div role={style === "radio" ? "radiogroup" : "group"} aria-label={name} className="flex flex-wrap gap-2">
          {values.map(({ value, available }) => {
            const isActive = selected === value;
            return (
              <label
                key={value}
                className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-200 ${isActive
                  ? "border-foreground bg-primary-soft text-foreground"
                  : available
                    ? "border-border bg-card text-foreground hover:border-primary cursor-pointer"
                    : "border-border bg-muted text-muted-foreground cursor-not-allowed line-through"
                  }`}
              >
                <input
                  type={style}
                  name={inputName}
                  value={value}
                  checked={isActive}
                  disabled={!available}
                  onChange={() => pick(value, available)}
                  className="sr-only peer"
                />
                <span
                  className={`flex-shrink-0 w-4 h-4 border-2 flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary ${style === "radio" ? "rounded-full" : "rounded"
                    } ${isActive ? "border-foreground bg-foreground" : "border-input bg-card"}`}
                >
                  {isActive &&
                    (style === "radio" ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    ) : (
                      <Check className="w-3 h-3 text-primary-ink" strokeWidth={3} />
                    ))}
                </span>
                {value}
              </label>
            );
          })}
        </div>
      )}

      {style === "buttons" && (
        <div className="flex flex-wrap gap-2">
          {values.map(({ value, available }) => (
            <button
              key={value}
              type="button"
              onClick={() => pick(value, available)}
              disabled={!available}
              aria-pressed={selected === value}
              className={buttonClass(selected === value, available)}
            >
              {value}
            </button>
          ))}
        </div>
      )}

      {style === "color" && (
        <div className="flex flex-wrap gap-3">
          {values.map(({ value, available }) => {
            const isActive = selected === value;
            const swatch = cssColor(value);
            // Names the browser can't paint (e.g. "Heather") still render as a labelled chip.
            if (!swatch) {
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => pick(value, available)}
                  disabled={!available}
                  aria-pressed={isActive}
                  className={buttonClass(isActive, available)}
                >
                  {value}
                </button>
              );
            }
            return (
              <button
                key={value}
                type="button"
                title={value}
                aria-label={value}
                aria-pressed={isActive}
                onClick={() => pick(value, available)}
                disabled={!available}
                className={`relative w-10 h-10 rounded-full transition-all duration-200 ${isActive
                  ? "ring-2 ring-offset-2 ring-foreground scale-105"
                  : available
                    ? "hover:scale-110"
                    : "opacity-35 cursor-not-allowed"
                  }`}
                style={{ backgroundColor: swatch, boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-foreground) 12%, transparent)" }}
              >
                {!available && (
                  <span className="absolute left-1/2 top-1/2 w-[130%] h-px bg-muted-foreground -translate-x-1/2 -translate-y-1/2 rotate-45" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
