import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  image: string;
  title: string;
  count: number;
}

function resolveImageSrc(image?: string) {
  const FALLBACK = "/placeholder.png";

  if (!image) return FALLBACK;
  if (image.startsWith("http")) return image;

  const base = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";
  if (!base) return FALLBACK;

  const trimmedBase = base.replace(/\/$/, "");
  const trimmedPath = image.replace(/^\//, "");

  return `${trimmedBase}/${trimmedPath}`;
}
export default function CategoryCard({
  image,
  title,
  count,
}: CategoryCardProps) {
  const src = resolveImageSrc(image);
  console.log(src, "src")
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
        {/* <div className="flex items-center gap-1 text-sm text-background/80">
          <span>{count} products</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </div> */}
      </div>
    </div>
  );
}