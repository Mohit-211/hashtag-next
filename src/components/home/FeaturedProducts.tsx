import ProductCard from "@/components/ProductCard";
<section className="py-20 lg:py-28 bg-secondary">
  <div className="container">
    <div className="max-w-2xl mb-10">
      <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3">
        Featured
      </p>
      <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground leading-tight mb-4">
        Most Loved Products
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed">
        These are some of the most loved and frequently customized products
        chosen by our customers for their versatility and personal expression.
        From everyday essentials to statement pieces, each one is designed to be
        a canvas for your creativity.
      </p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
      {products.map((p) => (
        <Link key={p.name} to="/product">
          <ProductCard {...p} />
        </Link>
      ))}
    </div>
    <div className="text-center mt-10">
      <Link to="/categories">
        <Button variant="outline" size="lg" className="rounded-lg gap-2">
          View All Products <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  </div>
</section>;
