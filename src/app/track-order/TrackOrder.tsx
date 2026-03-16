import { useState } from "react";
import Layout from "@/components/Layout";

import TrackLookup from "@/components/trackorder/TrackLookup";
import OrderStatusCard from "@/components/trackorder/OrderStatusCard";
import OrderProgress from "@/components/trackorder/OrderProgress";
import ShipmentDetails from "@/components/trackorder/ShipmentDetails";
import OrderedItems from "@/components/trackorder/OrderedItems";
import OrderPriceSummary from "@/components/trackorder/OrderPriceSummary";
import OrderSupport from "@/components/trackorder/OrderSupport";
import NoOrderState from "@/components/trackorder/NoOrderState";

import { useOrders, type Order } from "@/contexts/OrdersContext";

const TrackOrder = () => {
  const { orders } = useOrders();

  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

  const displayOrder = trackedOrder || (orders.length > 0 ? orders[0] : null);

  return (
    <Layout>
      <section className="py-8 lg:py-14">
        <div className="container max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold">
              Track Your Order
            </h1>
          </div>

          <TrackLookup setTrackedOrder={setTrackedOrder} />

          {displayOrder ? (
            <div className="space-y-8">
              <OrderStatusCard order={displayOrder} />

              <OrderProgress status={displayOrder.status} />

              <ShipmentDetails order={displayOrder} />

              <OrderedItems items={displayOrder.items} />

              <OrderPriceSummary order={displayOrder} />

              <OrderSupport />
            </div>
          ) : (
            <NoOrderState />
          )}
        </div>
      </section>
    </Layout>
  );
};

export default TrackOrder;
