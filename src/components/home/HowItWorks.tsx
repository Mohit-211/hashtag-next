import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HowItWorks() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3">
            HOW IT WORKS
          </p>

          <h2 className="text-3xl sm:text-4xl font-bold">
            3-Step Process
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-8 rounded-2xl border bg-background">
            <h3 className="text-xl font-semibold mb-4">
              Step 1 — Choose Your Product
            </h3>

            <p className="text-muted-foreground">
              Select from business cards, apparel, banners, stickers, and more.
            </p>
          </div>

          <div className="p-8 rounded-2xl border bg-background">
            <h3 className="text-xl font-semibold mb-4">
              Step 2 — Upload Artwork
            </h3>

            <p className="text-muted-foreground">
              We accept all major file types and offer free basic adjustments.
            </p>
          </div>

          <div className="p-8 rounded-2xl border bg-background">
            <h3 className="text-xl font-semibold mb-4">
              Step 3 — Approve Your Proof
            </h3>

            <p className="text-muted-foreground">
              Review your proof and move to final production.
            </p>
          </div>
        </div>

        <div className="text-center mt-10">
          <Button asChild variant="hero" size="lg">
            <Link href="/categories">
              Start Your Order
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}