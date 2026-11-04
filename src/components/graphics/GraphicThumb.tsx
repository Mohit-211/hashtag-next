"use client";

import { useState } from "react";
import { FileImage } from "lucide-react";
import type { SavedGraphic } from "@/api/operations/graphics.api";
import { canDrawGraphic, fileExtension } from "./graphicFiles";

/** The graphic itself where a browser can draw it; otherwise a file badge, also when it fails to load. */
export default function GraphicThumb({ graphic }: { graphic: SavedGraphic }) {
  const [failed, setFailed] = useState(false);

  if (failed || !canDrawGraphic(graphic)) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-muted">
        <FileImage size={24} className="text-muted-foreground" />
        <span className="rounded bg-foreground px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
          {fileExtension(graphic.original_name) || "file"}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- any size or format, straight from the customer's file
    <img
      src={graphic.file_url}
      alt={graphic.original_name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-contain p-1.5"
    />
  );
}
