import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function ConfirmationActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      

      <Link href="/">
        <Button variant="outline" size="lg">
          Continue Shopping
        </Button>
      </Link>
    </div>
  );
}
