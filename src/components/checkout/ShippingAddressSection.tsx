import InputField from "./InputField";

const ShippingAddressSection = ({ form, update }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-heading font-semibold">Shipping Address</h2>

      <InputField
        placeholder="Address Line 1"
        value={form.address1}
        onChange={(e) => update("address1", e.target.value)}
      />

      <InputField
        placeholder="Address Line 2"
        value={form.address2}
        onChange={(e) => update("address2", e.target.value)}
      />

      <div className="grid sm:grid-cols-3 gap-3">
        <InputField
          placeholder="City"
          value={form.city}
          onChange={(e) => update("city", e.target.value)}
        />

        <InputField
          placeholder="State"
          value={form.state}
          onChange={(e) => update("state", e.target.value)}
        />

        <InputField
          placeholder="Postal Code"
          value={form.postalCode}
          onChange={(e) => update("postalCode", e.target.value)}
        />
      </div>
    </div>
  );
};

export default ShippingAddressSection;
