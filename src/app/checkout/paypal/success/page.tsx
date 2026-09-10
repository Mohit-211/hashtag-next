import { Suspense } from "react";
import PaypalReturnStatus from "@/components/checkout/PaypalReturnStatus";
import ProcessingScreen from "@/components/checkout/ProcessingScreen";

export default function PaypalSuccessPage() {
  return (
    <Suspense fallback={<ProcessingScreen />}>
      page1
      <PaypalReturnStatus landedFrom="success" />
    </Suspense>
  );
}
