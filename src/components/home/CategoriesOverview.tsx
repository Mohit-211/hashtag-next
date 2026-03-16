import CategoryCard from "./CategoryCard";

<section className="py-20 lg:py-28 bg-secondary">
  <div className="container">
    <div className="max-w-2xl mb-10">
      <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3">
        Explore
      </p>
      <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground leading-tight mb-4">
        Shop by Category
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed">
        Browse our carefully curated categories to find what fits your style and
        purpose. Whether you're looking for wearable statements, everyday
        essentials, or something entirely unique — we've organized everything so
        you can explore with ease.
      </p>
    </div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {categories.map((cat) => (
        <CategoryCard key={cat.title} {...cat} />
      ))}
    </div>
  </div>
</section>;
