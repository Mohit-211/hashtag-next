interface Props {
  category: string;
}

export default function CategoryHeader({ category }: Props) {
  const title = category === "All" ? "All Products" : category;

  return (
    <section className="pt-12 pb-6">
      <div className="container max-w-4xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Browse
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-xs font-semibold tracking-[0.12em] text-[#4a7a58] uppercase">
            {title}
          </span>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-3 leading-tight">
          {title}
        </h1>

        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Browse customizable products crafted as a canvas for your creativity.
          Every item can be personalized with your own image or design.
        </p>
      </div>
    </section>
  );
}