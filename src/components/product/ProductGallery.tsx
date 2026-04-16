"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  attachments?: any[];
}

export default function ProductGallery({ attachments = [] }: Props) {
  const [active, setActive] = useState(0);

  // ✅ Simple mapping
  const images =
    attachments.length > 0
      ? attachments.map((item: any) =>
          typeof item === "string"
            ? item
            : `${item?.file_uri}`
        )
      : ["/assets/placeholder.jpg"];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-square rounded-xl overflow-hidden bg-secondary border">
        <Image
          src={images[active]}
             unoptimized={process.env.NODE_ENV === "development"}
          crossOrigin="anonymous"
          alt="Product"
          width={800}
          height={800}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnails */}
      <div className="flex gap-3">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
              active === i ? "border-primary" : "border-border"
            }`}
          >
            <Image
              src={img}
               unoptimized={process.env.NODE_ENV === "development"}
          crossOrigin="anonymous"
              alt={`thumb-${i}`}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}