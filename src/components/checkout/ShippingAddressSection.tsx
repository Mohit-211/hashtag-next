import InputField from "./InputField";

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

type ShippingAddressSectionProps = {
  form: CheckoutFormState;
  update: (field: keyof CheckoutFormState, value: string) => void;
};

export default function ShippingAddressSection({
  form,
  update,
}: ShippingAddressSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-heading font-semibold">Shipping Address</h2>

      <InputField
        placeholder="Address Line 1"
        value={form.address1}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          update("address1", e.target.value)
        }
      />

      <InputField
        placeholder="Address Line 2"
        value={form.address2}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          update("address2", e.target.value)
        }
      />

      <div className="grid sm:grid-cols-3 gap-3">
        <InputField
          placeholder="City"
          value={form.city}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            update("city", e.target.value)
          }
        />

        <InputField
          placeholder="State"
          value={form.state}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            update("state", e.target.value)
          }
        />

        <InputField
          placeholder="Postal Code"
          value={form.postalCode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            update("postalCode", e.target.value)
          }
        />
      </div>
    </div>
  );
}
