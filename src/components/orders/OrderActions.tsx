import { Button } from "@/components/ui/button";
import { RotateCcw, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

const OrderActions = ({ order }) => {
  const { addItem } = useCart();
  const { toast } = useToast();

  const reorder = () => {
    order.items.forEach((item) => {
      addItem({
        ...item,
        id: `reorder-${item.id}-${Date.now()}`,
      });
    });

    toast({
      title: "Added to Cart",
      description: `Items from order #${order.orderId} added to cart`,
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Link to="/track">
        <Button variant="hero" size="sm" className="gap-1.5">
          <Package className="h-4 w-4" />
          Track Order
        </Button>
      </Link>

      <Button variant="outline" size="sm" onClick={reorder} className="gap-1.5">
        <RotateCcw className="h-4 w-4" />
        Reorder
      </Button>
    </div>
  );
};

export default OrderActions;
