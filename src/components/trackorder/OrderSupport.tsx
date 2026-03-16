// components/trackorder/OrderSupport.tsx

import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function OrderSupport() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase text-muted-foreground">
        Need Help?
      </p>

      <p className="text-sm text-muted-foreground">
        If you have questions about your delivery or need help updating shipping
        details, our support team is ready to assist you.
      </p>

      <Button variant="outline" size="sm" className="rounded-lg gap-1.5">
        <Mail className="h-4 w-4" />
        Contact Support
      </Button>
    </div>
  );
}
