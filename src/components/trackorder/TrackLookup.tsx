import { useState } from "react";
import { Search, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrders, type Order } from "@/contexts/OrdersContext";

interface Props {
  setTrackedOrder: (order: Order | null) => void;
}

const TrackLookup = ({ setTrackedOrder }: Props) => {
  const { orders } = useOrders();

  const [lookupId, setLookupId] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [error, setError] = useState("");

  const handleLookup = () => {
    setError("");

    const cleanId = lookupId.replace("#", "").trim();

    const found = orders.find((o) => o.orderId === cleanId);

    if (found) setTrackedOrder(found);
    else setError("Order not found.");
  };

  return (
    <div className="bg-card border rounded-xl p-5 mb-8 space-y-4">
      <p className="text-xs font-bold uppercase text-muted-foreground">
        Track by Order ID
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
          <input
            placeholder="Order ID"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            className="input pl-9"
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
          <input
            placeholder="Email"
            value={lookupEmail}
            onChange={(e) => setLookupEmail(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      <Button variant="hero" onClick={handleLookup}>
        Track Order
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default TrackLookup;
