// components/product/ProductGallery.tsx

"use client";

import { useState } from "react";
import Image from "next/image";

const gallery = [
  "/assets/product-detail-main.jpg",
  "/assets/product-detail-back.jpg",
  "/assets/product-detail-closeup.jpg",
];

export default function ProductGallery() {
  const [active, setActive] = useState<number>(0);

  return (
    <div className="space-y-4">
      <div className="aspect-square rounded-xl overflow-hidden bg-secondary border">
        <Image
          src={gallery[active]}
          alt="Product image"
          width={800}
          height={800}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex gap-3">
        {gallery.map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
              active === i ? "border-primary" : "border-border"
            }`}
          >
            <Image
              src={img}
              alt={`Product thumbnail ${i + 1}`}
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
