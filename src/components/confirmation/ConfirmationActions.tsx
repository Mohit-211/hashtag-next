import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function ConfirmationActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Link href="/track">
        <Button variant="hero" size="lg" className="gap-2">
          Track Order
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>

      <Link href="/">
        <Button variant="outline" size="lg">
          Continue Shopping
        </Button>
      </Link>
    </div>
  );
}
