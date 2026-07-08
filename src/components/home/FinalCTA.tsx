import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FinalCTA() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container">

        <div className="bg-black rounded-2xl p-10 md:p-16 text-center">

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Print Something Great?
          </h2>

          <p className="text-white/70 max-w-2xl mx-auto mb-8">
            Start your custom printing project today with premium quality,
            transparent pricing, and fast production.
          </p>

          <Link href="/categories">
            <Button
              variant="hero"
              size="lg"
              className="rounded-lg px-10"
            >
              START YOUR PROJECT
            </Button>
          </Link>

        </div>

      </div>
    </section>
  );
}