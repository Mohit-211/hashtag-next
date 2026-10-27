import { Suspense } from "react";
import PaypalReturnStatus from "@/components/checkout/PaypalReturnStatus";
import ProcessingScreen from "@/components/checkout/ProcessingScreen";

export default function PaypalSuccessPage() {
  return (
    <Suspense fallback={<ProcessingScreen />}>
      <PaypalReturnStatus landedFrom="success" />
    </Suspense>
  );
}
