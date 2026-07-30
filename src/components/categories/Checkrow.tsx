"use client";
import { Check } from "lucide-react";

interface CheckRowProps {
  checked: boolean;
  label: string;
  count?: number;
  onToggle: () => void;
}

/** A single checkable row (checkbox + label + optional count), used across
 * the Category tree, Brands list, and other sidebar facets. */
export default function CheckRow({ checked, label, count, onToggle }: CheckRowProps) {
  return (
    <div
      className="check-row"
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <span className="check-row-left">
        <span className={`checkbox-box ${checked ? "checked" : ""}`}>
          {checked && <Check size={11} strokeWidth={3} />}
        </span>
        <span className="check-row-name" title={label}>{label}</span>
      </span>
      {count != null && <span className="check-row-count">{count}</span>}
    </div>
  );
}