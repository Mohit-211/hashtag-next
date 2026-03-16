import Image from "next/image";

export default function About() {
  return (
    <section className="py-10 lg:py-16">
      <div className="container max-w-3xl space-y-14">
        {/* Header */}
        <div className="space-y-6">
          <Image
            src="/assets/about-hero.jpg"
            alt="HashtagBillionaire brand"
            width={1200}
            height={500}
            className="w-full h-48 lg:h-64 object-cover rounded-xl"
            priority
          />

          <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground">
            About Hashtag<span className="text-primary">Billionaire</span>
          </h1>

          <p className="text-muted-foreground text-sm leading-relaxed">
            HashtagBillionaire is a modern ecommerce platform built around one
            simple idea — that every product you own should reflect who you are.
            We combine clean, thoughtful design with powerful customization
            tools so you can create products that feel personal, intentional,
            and entirely yours. From concept to delivery, the experience is
            designed to be straightforward, transparent, and focused on your
            vision.
          </p>
        </div>

        {/* Philosophy */}
        <div className="space-y-4">
          <h2 className="text-xl font-heading font-bold text-foreground">
            Our Philosophy
          </h2>

          <p className="text-muted-foreground text-sm leading-relaxed">
            We believe that the products people choose to wear, carry, and use
            every day are more than just objects. They are extensions of
            identity, creativity, and personal taste. At HashtagBillionaire, we
            approach product design with this understanding at the center. Every
            feature we build, every option we offer, and every detail we refine
            is guided by the principle that simplicity and self-expression
            should work together — not compete. When the process is clear and
            the tools are intuitive, the result is something that genuinely
            represents you.
          </p>
        </div>

        {/* Separator */}
        <div className="h-px bg-border" />

        {/* What Makes Us Different */}
        <div className="space-y-4">
          <h2 className="text-xl font-heading font-bold text-foreground">
            What Makes Us Different
          </h2>

          <p className="text-muted-foreground text-sm leading-relaxed">
            HashtagBillionaire gives you the ability to upload your own images
            and place them exactly where you want on a product. You choose the
            placement locations, see how everything looks before you commit, and
            understand exactly what each option costs with fully transparent
            pricing — no hidden fees, no surprises. The entire shopping flow is
            designed to feel effortless, from browsing and customizing to
            checkout and delivery tracking. We have intentionally kept the
            experience clean and modern, removing unnecessary complexity so you
            can focus on what matters: making something that is truly yours.
          </p>
        </div>

        {/* Closing */}
        <div className="space-y-4">
          <h2 className="text-xl font-heading font-bold text-foreground">
            Built for You
          </h2>

          <p className="text-muted-foreground text-sm leading-relaxed">
            Everything at HashtagBillionaire is built with the customer in mind.
            We keep our processes simple, our communication honest, and our
            standards high. Whether you are placing your first order or your
            fiftieth, the experience is designed to feel reliable, personal, and
            worth your time. Your trust is the foundation of everything we do,
            and we work every day to earn it.
          </p>
        </div>

        {/* Tagline */}
        <div className="text-center py-6">
          <p className="text-lg font-heading font-bold text-foreground">
            Build your <span className="text-primary">identity.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
