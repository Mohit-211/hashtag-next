const industries = [
  "Small Businesses & Startups",
  "Corporate & Enterprise Teams",
  "Creators, Influencers & Clothing Brands",
  "Event Planners & Organizations",
  "Nonprofits & Community Groups",
  "Individuals & One-Off Projects",
];

export default function WhoWeServe() {
  return (
    <section className="py-20 lg:py-28 bg-secondary">
      <div className="container">

        <div className="text-center max-w-3xl mx-auto mb-14">

          <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3">
            WHO WE SERVE
          </p>

          <h2 className="text-3xl sm:text-4xl font-bold">
            Solutions for Every Industry
          </h2>

        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {industries.map((item) => (
            <div
              key={item}
              className="rounded-2xl border p-8 bg-background font-medium"
            >
              {item}
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}