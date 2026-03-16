import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  image: string;
  title: string;
  count: number;
}

const CategoryCard = ({ image, title, count }: CategoryCardProps) => {
  return (
    <Link
      to="/categories"
      className="group relative overflow-hidden rounded-xl aspect-[3/2] block"
    >
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-foreground/40 group-hover:bg-foreground/50 transition-colors" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-lg font-heading font-bold text-background">{title}</h3>
        <div className="flex items-center gap-1 text-sm text-background/80">
          <span>{count} products</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
