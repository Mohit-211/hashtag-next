import { useState } from "react";
import { CreditCard, Smartphone, Banknote } from "lucide-react";
import RadioOption from "./RadioOption";

const PaymentMethodSection = () => {
  const [method, setMethod] = useState("card");

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-heading font-semibold">Payment Method</h2>

      <RadioOption
        selected={method === "card"}
        onSelect={() => setMethod("card")}
        icon={<CreditCard className="h-5 w-5" />}
        label="Card"
        desc="Visa / Mastercard"
      />

      <RadioOption
        selected={method === "upi"}
        onSelect={() => setMethod("upi")}
        icon={<Smartphone className="h-5 w-5" />}
        label="UPI"
        desc="Google Pay / PhonePe"
      />

      <RadioOption
        selected={method === "cod"}
        onSelect={() => setMethod("cod")}
        icon={<Banknote className="h-5 w-5" />}
        label="Cash on Delivery"
        desc="Pay on arrival"
      />
    </div>
  );
};

export default PaymentMethodSection;
