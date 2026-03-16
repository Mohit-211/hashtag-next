interface Props {
  category: string;
}

export default function CategoryHeader({ category }: Props) {
  const title = category === "All" ? "All Products" : category;

  return (
    <section className="pt-12 pb-8">
      <div className="container max-w-4xl">
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3">
          Browse
        </p>

        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
          {title}
        </h1>

        <p className="text-base text-muted-foreground max-w-2xl">
          Browse customizable products crafted as a canvas for your creativity.
        </p>
      </div>
    </section>
  );
}
