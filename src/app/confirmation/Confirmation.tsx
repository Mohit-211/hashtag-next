import Layout from "@/components/Layout";
import { useLocation } from "react-router-dom";

import ConfirmationHeader from "@/components/confirmation/ConfirmationHeader";
import OrderInfoCard from "@/components/confirmation/OrderInfoCard";
import OrderedItems from "@/components/confirmation/OrderedItems";
import PriceSummary from "@/components/confirmation/PriceSummary";
import NextSteps from "@/components/confirmation/NextSteps";
import ConfirmationActions from "@/components/confirmation/ConfirmationActions";

import type { CartItem } from "@/contexts/CartContext";

interface OrderState {
  orderId: string;
  items: CartItem[];
  subtotal: number;
  customizationTotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  paymentMethod: string;
  shippingMethod: string;
  date: string;
}

const Confirmation = () => {
  const location = useLocation();
  const order = location.state as OrderState | null;

  const orderId = order?.orderId || "HB00000001";

  const orderDate = order?.date
    ? new Date(order.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  return (
    <Layout>
      <section className="py-10 lg:py-16">
        <div className="container max-w-3xl">
          <ConfirmationHeader />

          <OrderInfoCard
            orderId={orderId}
            orderDate={orderDate}
            paymentMethod={order?.paymentMethod || "card"}
          />

          <OrderedItems items={order?.items || []} />

          {order && <PriceSummary order={order} />}

          <NextSteps />

          <ConfirmationActions />
        </div>
      </section>
    </Layout>
  );
};

export default Confirmation;
