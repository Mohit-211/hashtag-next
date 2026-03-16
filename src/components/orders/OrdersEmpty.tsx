import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import emptyOrdersImg from "@/assets/empty-orders.jpg";

const OrdersEmpty = () => {
  return (
    <section className="py-20">
      <div className="container max-w-lg text-center space-y-6">
        <img
          src={emptyOrdersImg}
          alt="No orders"
          className="w-32 h-32 mx-auto object-contain"
        />

        <h1 className="text-3xl font-heading font-bold">No Orders Yet</h1>

        <p className="text-muted-foreground">
          When you place orders they will appear here.
        </p>

        <Link to="/categories">
          <Button variant="hero" size="lg" className="gap-2">
            <ShoppingBag className="h-5 w-5" />
            Browse Products
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default OrdersEmpty;
