import Image from "next/image";

export default function BrandIntroduction() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text */}
          <div className="space-y-6">
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              Our Philosophy
            </p>

            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground leading-tight">
              More Than Products.
              <br />A Platform for Identity.
            </h2>

            <p className="text-base text-muted-foreground leading-relaxed">
              At HashtagBillionaire, we believe that every product you own
              should say something about who you are. Our focus is on
              individuality, customization, and allowing customers to transform
              simple everyday items into personal statements. Whether it's a
              t-shirt that carries your message or a mug that starts your
              morning with intention — every piece is crafted with quality,
              clarity, and a modern sense of identity.
            </p>

            <p className="text-base text-muted-foreground leading-relaxed">
              We don't follow trends. We help you create them. With carefully
              selected base products and an intuitive customization experience,
              you have the tools to design something truly yours.
            </p>
          </div>

          {/* Image */}
          <div>
            <Image
              src="/assets/brand-showcase.jpg"
              alt="HashtagBillionaire customizable product lineup on white background"
              width={900}
              height={700}
              className="w-full rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
