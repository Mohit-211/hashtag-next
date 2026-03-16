import { useState } from "react";

import ContactSection from "./ContactSection";
import ShippingAddressSection from "./ShippingAddressSection";
import ShippingMethodSection from "./ShippingMethodSection";
import PaymentMethodSection from "./PaymentMethodSection";

const CheckoutForm = () => {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const update = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  return (
    <div className="lg:col-span-2 space-y-8">
      <ContactSection form={form} update={update} />

      <ShippingAddressSection form={form} update={update} />

      <ShippingMethodSection />

      <PaymentMethodSection />
    </div>
  );
};

export default CheckoutForm;
