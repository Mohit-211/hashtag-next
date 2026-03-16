import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import emptyCartImg from "@/assets/empty-cart.jpg";

const CartEmpty = () => {
  return (
    <section className="py-20">
      <div className="container max-w-lg text-center space-y-6">
        <img
          src={emptyCartImg}
          alt="Empty cart"
          className="w-48 h-48 mx-auto object-contain opacity-80"
        />

        <h1 className="text-3xl font-heading font-bold text-foreground">
          Your Cart is Empty
        </h1>

        <p className="text-base text-muted-foreground leading-relaxed">
          Your cart is currently empty. Explore products and create something
          uniquely yours.
        </p>

        <Link to="/categories">
          <Button variant="hero" size="lg" className="rounded-lg gap-2 mt-2">
            <ShoppingBag className="h-5 w-5" />
            Browse Products
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CartEmpty;
