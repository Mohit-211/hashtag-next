import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  image: string;
  title: string;
  count: number;
}

export default function CategoryCard({
  image,
  title,
  count,
}: CategoryCardProps) {
  return (
    <Link
      href="/categories"
      className="group relative overflow-hidden rounded-xl aspect-[3/2] block"
    >
      <Image
        src={image}
        alt={title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover group-hover:scale-105 transition-transform duration-500"
      />

      <div className="absolute inset-0 bg-foreground/40 group-hover:bg-foreground/50 transition-colors" />

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-lg font-heading font-bold text-background">
          {title}
        </h3>

        <div className="flex items-center gap-1 text-sm text-background/80">
          <span>{count} products</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
