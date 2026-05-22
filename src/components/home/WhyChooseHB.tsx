export default function WhyChooseHB() {
  const items = [
    {
      title: "Business-Grade Quality",
      desc: "Premium materials & sharp print detail",
    },
    {
      title: "Bulk Pricing",
      desc: "Save more as you scale",
    },
    {
      title: "Transparent Process",
      desc: "No hidden fees, ever",
    },
  ];

  return (
    <section className="py-20 lg:py-28">
      <div className="container">

        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Why Businesses Choose HashtagBillionaire
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              className="p-8 rounded-2xl border bg-background"
            >
              <h3 className="text-xl font-semibold mb-3">
                {item.title}
              </h3>

              <p className="text-muted-foreground">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}