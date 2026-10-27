import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ConfirmationActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Button asChild variant="hero" size="lg">
        <Link href="/orders">View My Orders</Link>
      </Button>

      <Button asChild variant="outline" size="lg">
        <Link href="/categories?view=all">Continue Shopping</Link>
      </Button>
    </div>
  );
}
