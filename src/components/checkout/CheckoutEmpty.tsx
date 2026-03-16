import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CheckoutEmpty = () => {
  return (
    <section className="py-20">
      <div className="container max-w-lg text-center space-y-6">
        <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" />

        <h1 className="text-3xl font-heading font-bold text-foreground">
          Nothing to Checkout
        </h1>

        <p className="text-muted-foreground">
          Your cart is empty. Add products before checkout.
        </p>

        <Link to="/categories">
          <Button variant="hero" size="lg">
            Browse Products
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CheckoutEmpty;
