"use client";

import type { MouseEvent } from "react";

/** One colour option. `hex` may hold several comma-separated codes (two-tone garments). */
export interface ColorVariant {
  id: string;
  name: string;
  hex: string;
  image: string;
}

function parseHex(code: string): [number, number, number] | null {
  const m = code.trim().replace(/^#/, "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

/** Relative luminance (0 black … 1 white); unknown codes count as mid-grey. */
function luminance(code: string): number {
  const rgb = parseHex(code);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function swatchCodes(hex: string): string[] {
  return hex.split(",").map((c) => c.trim()).filter(Boolean);
}

interface ColorSwatchProps {
  variant: ColorVariant;
  selected: boolean;
  /** Diameter in px — 24 on cards, 32 on the product page. */
  size?: number;
  disabled?: boolean;
  onSelect: (variant: ColorVariant) => void;
}

export function ColorSwatch({ variant, selected, size = 24, disabled, onSelect }: ColorSwatchProps) {
  const codes = swatchCodes(variant.hex);
  const background =
    codes.length > 1 ? `linear-gradient(135deg, ${codes.join(",")})` : codes[0] || "var(--color-muted)";
  const avgLum = codes.length ? codes.reduce((s, c) => s + luminance(c), 0) / codes.length : 0.5;
  const isLight = avgLum > 0.6;
  const check = Math.round(size * 0.55);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(variant);
  };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${variant.name}${disabled ? " (sold out)" : ""}`}
      title={`${variant.name}${disabled ? " (sold out)" : ""}`}
      onClick={handleClick}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground hover:scale-110`}
      style={{
        width: size,
        height: size,
        background,
        // Hairline keeps white/pale swatches visible; the selected one adds an offset ring.
        boxShadow: [
          `inset 0 0 0 1px color-mix(in srgb, var(--color-foreground) ${isLight ? 25 : 12}%, transparent)`,
          selected && "0 0 0 2px var(--color-background), 0 0 0 3.5px var(--color-foreground)",
        ]
          .filter(Boolean)
          .join(", "),
      }}
    >
      {selected && (
        <svg
          width={check}
          height={check}
          viewBox="0 0 24 24"
          fill="none"
          stroke={isLight ? "#111827" : "#ffffff"}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      )}
      {disabled && (
        <span className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <span className="absolute inset-0 rounded-full" style={{
            background: `linear-gradient(to top right, transparent calc(50% - 1px), ${isLight ? "#111827" : "#ffffff"} calc(50% - 1px), ${isLight ? "#111827" : "#ffffff"} calc(50% + 1px), transparent calc(50% + 1px))`,
            opacity: 0.7,
          }} />
        </span>
      )}
    </button>
  );
}

interface ColorSwatchListProps {
  variants: ColorVariant[];
  selectedId: string | null;
  onSelect: (variant: ColorVariant) => void;
  size?: number;
  /** Show at most this many; the rest collapse into a "+N" label. */
  max?: number;
  /** Ids of swatches to show as disabled (e.g. sold-out colours). */
  disabledIds?: ReadonlySet<string>;
  label?: string;
  className?: string;
}

export function ColorSwatchList({
  variants,
  selectedId,
  onSelect,
  size = 24,
  max,
  disabledIds,
  label = "Color",
  className = "",
}: ColorSwatchListProps) {
  let shown = max != null && variants.length > max ? variants.slice(0, max) : variants;
  // Keep the selected colour visible even when it would fall past the cut.
  const selected = variants.find((v) => v.id === selectedId);
  if (selected && !shown.includes(selected)) shown = [...shown.slice(0, -1), selected];
  const extra = variants.length - shown.length;

  return (
    <div role="radiogroup" aria-label={label} className={`flex flex-wrap items-center gap-2 ${className}`}>
      {shown.map((v) => (
        <ColorSwatch key={v.id} variant={v} size={size} selected={v.id === selectedId} disabled={disabledIds?.has(v.id)} onSelect={onSelect} />
      ))}
      {extra > 0 && <span className="text-xs font-medium text-muted-foreground">+{extra}</span>}
    </div>
  );
}
