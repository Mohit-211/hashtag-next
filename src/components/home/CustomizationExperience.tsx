<section className="py-20 lg:py-28">
  <div className="container">
    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
      <div className="order-2 lg:order-1">
        <img
          src={customizationUi}
          alt="HashtagBillionaire product customization interface preview"
          className="w-full rounded-2xl shadow-lg border border-border"
        />
      </div>
      <div className="order-1 lg:order-2 space-y-6">
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
          Customization
        </p>
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground leading-tight">
          Design It Your Way
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Our customization experience is built to be simple, transparent, and
          completely user-focused. You can upload your own image, choose the
          exact placement on your product, and see live pricing before making
          any commitment. There are no hidden steps or surprise charges — just a
          clean, intuitive process that puts you in full control of your
          creation.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Whether you're designing for yourself or creating something meaningful
          for someone else, the entire journey from idea to finished product
          takes just a few minutes.
        </p>
        <Link to="/categories">
          <Button variant="hero" className="rounded-lg gap-2 mt-2">
            Start Customizing <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  </div>
</section>;
