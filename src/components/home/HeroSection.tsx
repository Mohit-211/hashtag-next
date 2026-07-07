import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-16 lg:py-24">

          <div className="space-y-8">

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight">
              Premium Printing for Businesses,
              <br />
              Creators & Events
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
              Apparel, business cards, banners, signage,
              stickers, and promo items, printed with precision.
            </p>

            <div className="flex flex-wrap gap-3">

              <Link href="/categories">
                <Button
                  variant="hero"
                  size="lg"
                  className="rounded-lg px-8 gap-2"
                >
                  Start a Print Project
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/categories">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-lg px-8"
                >
                  Browse Print Products
                </Button>
              </Link>

            </div>
          </div>

          <div className="relative">
            <Image
              src="/assets/HomeImage/image1.jpeg"
              alt="Printing products"
              width={900}
              height={700}
              priority
              className="w-full h-auto rounded-2xl object-cover"
            />
          </div>

        </div>
      </div>
    </section>
  );
}