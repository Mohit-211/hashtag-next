import { useState } from "react";

import mainImg from "@/assets/product-detail-main.jpg";
import backImg from "@/assets/product-detail-back.jpg";
import closeupImg from "@/assets/product-detail-closeup.jpg";

const gallery = [mainImg, backImg, closeupImg];

const ProductGallery = () => {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-4">
      <div className="aspect-square rounded-xl overflow-hidden bg-secondary border">
        <img src={gallery[active]} className="w-full h-full object-cover" />
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
            <img src={img} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductGallery;
