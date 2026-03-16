"use client";

import { useState } from "react";

import ContactSection from "./ContactSection";
import ShippingAddressSection from "./ShippingAddressSection";
import ShippingMethodSection from "./ShippingMethodSection";
import PaymentMethodSection from "./PaymentMethodSection";

type CheckoutFormState = {
  fullName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export default function CheckoutForm() {
  const [form, setForm] = useState<CheckoutFormState>({
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

  const update = (field: keyof CheckoutFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="lg:col-span-2 space-y-8">
      <ContactSection form={form} update={update} />

      <ShippingAddressSection form={form} update={update} />

      <ShippingMethodSection />

      <PaymentMethodSection />
    </div>
  );
}
