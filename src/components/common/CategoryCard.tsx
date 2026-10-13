import Image from "next/image";
import { resolveImageSrc } from "@/lib/images";

interface CategoryCardProps {
  image?: string | null;
  title: string;
}

export default function CategoryCard({
  image,
  title,
}: CategoryCardProps) {
  const src = resolveImageSrc(image);
  return (
    <div className="group relative overflow-hidden rounded-xl aspect-[4/3] block cursor-pointer">
      <Image
        src={src}
        alt={title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        crossOrigin="anonymous"
        className="[object-fit:inherit] transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-foreground/15 group-hover:bg-foreground/50 transition-colors" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-lg font-heading font-bold text-background">
          {title}
        </h3>
      </div>
    </div>
  );
}