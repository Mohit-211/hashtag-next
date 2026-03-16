import { Star } from "lucide-react";

const ProductInfo = () => {
  return (
    <div>
      <span className="text-xs uppercase text-muted-foreground">Apparel</span>

      <h1 className="text-3xl font-heading font-bold">Classic Custom Tee</h1>

      <div className="flex items-center gap-1 mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < 4 ? "fill-primary text-primary" : "text-border"
            }`}
          />
        ))}

        <span className="text-sm text-muted-foreground ml-2">
          4.0 (128 reviews)
        </span>
      </div>

      <p className="mt-4 text-muted-foreground">
        A premium quality cotton tee designed to be your canvas.
      </p>

      <p className="text-2xl font-bold mt-4">$799</p>
    </div>
  );
};

export default ProductInfo;
