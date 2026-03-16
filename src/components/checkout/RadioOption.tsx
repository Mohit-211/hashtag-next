"use client";

import { ReactNode } from "react";

type RadioOptionProps = {
  selected: boolean;
  onSelect: () => void;
  icon: ReactNode;
  label: string;
  desc?: string;
};

export default function RadioOption({
  selected,
  onSelect,
  icon,
  label,
  desc,
}: RadioOptionProps) {
  return (
    <label
      onClick={onSelect}
      className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer ${
        selected ? "border-primary bg-primary/10" : "border-border"
      }`}
    >
      <div
        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
          selected ? "border-primary" : "border-border"
        }`}
      >
        {selected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </div>

      <div className="text-muted-foreground">{icon}</div>

      <div>
        <p className="text-sm font-medium">{label}</p>

        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
    </label>
  );
}
