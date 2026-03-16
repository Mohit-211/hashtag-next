import { Button } from "@/components/ui/button";
import { inputClass } from "../../data/constants";

interface Props {
  formData: any;
  setFormData: (data: any) => void;
  onSave: (data: any) => void;
  onCancel: () => void;
  editing: boolean;
}

const AddressForm = ({
  formData,
  setFormData,
  onSave,
  onCancel,
  editing,
}: Props) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-border rounded-lg p-5 space-y-4 bg-secondary/30"
    >
      <h3 className="text-sm font-semibold">
        {editing ? "Edit Address" : "Add New Address"}
      </h3>

      <div className="grid sm:grid-cols-2 gap-4">
        <input
          placeholder="Full Name"
          value={formData.fullName}
          onChange={(e) =>
            setFormData({ ...formData, fullName: e.target.value })
          }
          className={inputClass}
          required
        />

        <input
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className={inputClass}
          required
        />
      </div>

      <input
        placeholder="Address Line 1"
        value={formData.line1}
        onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
        className={inputClass}
        required
      />

      <input
        placeholder="Address Line 2"
        value={formData.line2}
        onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
        className={inputClass}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <input
          placeholder="City"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          className={inputClass}
          required
        />

        <input
          placeholder="State"
          value={formData.state}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          className={inputClass}
          required
        />

        <input
          placeholder="Postal Code"
          value={formData.postalCode}
          onChange={(e) =>
            setFormData({ ...formData, postalCode: e.target.value })
          }
          className={inputClass}
          required
        />
      </div>

      <input
        placeholder="Country"
        value={formData.country}
        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        className={inputClass}
        required
      />

      <div className="flex gap-3">
        <Button type="submit" size="sm">
          {editing ? "Update Address" : "Save Address"}
        </Button>

        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default AddressForm;
