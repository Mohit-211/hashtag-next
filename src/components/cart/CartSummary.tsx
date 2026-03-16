import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CartSummary = ({ subtotal, customizationTotal, grandTotal }: any) => {
  const shipping = grandTotal >= 999 ? 0 : 99;
  const finalTotal = grandTotal + shipping;

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-24 bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-heading font-bold text-lg">Order Summary</h2>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>${subtotal}</span>
          </div>

          {customizationTotal > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Customization</span>
              <span>+${customizationTotal}</span>
            </div>
          )}

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : `$${shipping}`}</span>
          </div>

          {shipping > 0 && (
            <p className="text-xs text-muted-foreground">
              Free shipping above $999
            </p>
          )}
        </div>

        <div className="border-t border-border pt-3 flex justify-between font-heading font-bold">
          <span>Total</span>
          <span className="text-primary text-xl">${finalTotal}</span>
        </div>

        <div className="space-y-2 pt-2">
          <Link to="/checkout">
            <Button variant="hero" size="lg" className="w-full">
              Proceed to Checkout
            </Button>
          </Link>

          <Link to="/categories">
            <Button variant="outline" size="lg" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
