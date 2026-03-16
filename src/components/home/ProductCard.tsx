import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ProductCardProps {
  image: string;
  name: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  customizable?: boolean;
}

const ProductCard = ({
  image,
  name,
  price,
  originalPrice,
  badge,
  customizable,
}: ProductCardProps) => {
  const [liked, setLiked] = useState(false);

  return (
    <div className="group relative bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {badge && (
          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-md">
            {badge}
          </span>
        )}
        <button
          onClick={() => setLiked(!liked)}
          className={`absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center transition-all ${
            liked
              ? "bg-primary text-primary-foreground"
              : "bg-background/80 text-foreground hover:bg-background"
          }`}
        >
          <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
        </button>
        {/* Quick add */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button variant="hero" size="sm" className="w-full gap-2 rounded-md">
            <ShoppingBag className="h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-1.5">
        <h3 className="text-sm font-medium text-foreground truncate">{name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-base font-heading font-bold text-foreground">
            ${price}
          </span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${originalPrice}
            </span>
          )}
        </div>
        {customizable && (
          <span className="inline-block text-[10px] font-semibold tracking-wide text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            CUSTOMIZABLE
          </span>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
