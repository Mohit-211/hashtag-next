import ProductCard from "@/components/ProductCard";
import { Link } from "react-router-dom";

import productHoodie from "@/assets/product-hoodie.jpg";
import productCap from "@/assets/product-cap.jpg";
import productMug from "@/assets/product-mug.jpg";
import productTote2 from "@/assets/product-tote2.jpg";

const related = [
  {
    image: productHoodie,
    name: "Premium Hoodie",
    price: 1899,
    customizable: true,
  },
  {
    image: productCap,
    name: "Statement Cap",
    price: 599,
    customizable: true,
  },
  {
    image: productMug,
    name: "Custom Ceramic Mug",
    price: 449,
    customizable: true,
  },
  {
    image: productTote2,
    name: "Canvas Tote Bag",
    price: 549,
    customizable: true,
  },
];

const RelatedProducts = () => {
  return (
    <div className="mt-20">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-6">
        Similar Products You May Like
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {related.map((product) => (
          <Link key={product.name} to="/product">
            <ProductCard {...product} />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
