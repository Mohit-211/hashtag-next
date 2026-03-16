import Layout from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useNavigate } from "react-router-dom";

import CheckoutEmpty from "@/components/checkout/CheckoutEmpty";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";

const Checkout = () => {
  const { items, subtotal, customizationTotal, grandTotal, clearCart } =
    useCart();
  const { addOrder } = useOrders();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <Layout>
        <CheckoutEmpty />
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-8 lg:py-14">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Checkout
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              You're almost there. Confirm your details and place the order.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <CheckoutForm />

            <CheckoutSummary
              items={items}
              subtotal={subtotal}
              customizationTotal={customizationTotal}
              grandTotal={grandTotal}
              clearCart={clearCart}
              addOrder={addOrder}
              navigate={navigate}
            />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
CheckoutEmpty.tsx CheckoutForm.tsx ContactSection.tsx ShippingAddressSection.tsx ShippingMethodSection.tsx PaymentMethodSection.tsx CheckoutSummary.tsx InputField.tsx RadioOption.ts 