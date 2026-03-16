import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-16 lg:py-24">
          {/* Text */}
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-heading font-bold text-foreground leading-[1.1] tracking-tight">
              Build Your Identity.
              <br />
              <span className="relative inline-block mt-1">
                Wear Your Statement.
                <span className="absolute -bottom-1.5 left-0 right-0 h-3 bg-primary/30 -z-10 rounded-sm" />
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
              HashtagBillionaire is more than a store — it is a platform for
              self-expression, personal branding, and individuality through
              customized products. Every item you create here becomes a
              reflection of who you are and what you stand for.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/categories">
                <Button
                  variant="hero"
                  size="lg"
                  className="gap-2 rounded-lg px-8"
                >
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/categories">
                <Button variant="outline" size="lg" className="rounded-lg px-8">
                  Explore Categories
                </Button>
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <Image
              src="/assets/hero-lifestyle.jpg"
              alt="Person wearing a premium customizable product from HashtagBillionaire"
              width={900}
              height={700}
              priority
              className="w-full h-auto max-h-[550px] object-cover rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
