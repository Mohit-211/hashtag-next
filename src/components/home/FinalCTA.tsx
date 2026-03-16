<section className="py-20 lg:py-28">
        <div className="container">
          <div className="bg-foreground rounded-2xl p-10 md:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-background leading-tight mb-4">
              Start Creating Your Signature Today.
            </h2>
            <p className="text-base text-background/70 leading-relaxed max-w-lg mx-auto mb-8">
              Explore our collection, pick the products that speak to you, and
              create something personal and meaningful. Your identity deserves
              to be seen — and we're here to help you express it.
            </p>
            <Link to="/categories">
              <Button
                variant="hero"
                size="lg"
                className="rounded-lg px-10 gap-2"
              >
                Browse Products
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};
