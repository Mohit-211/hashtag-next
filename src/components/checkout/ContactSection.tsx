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

type ContactSectionProps = {
  form: CheckoutFormState;
  update: (field: keyof CheckoutFormState, value: string) => void;
};

export default function ContactSection({ form, update }: ContactSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-heading font-semibold">
        Contact Information
      </h2>

      <InputField
        placeholder="Full Name"
        value={form.fullName}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          update("fullName", e.target.value)
        }
      />

      <div className="grid sm:grid-cols-2 gap-3">
        <InputField
          placeholder="Email Address"
          value={form.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            update("email", e.target.value)
          }
        />

        <InputField
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            update("phone", e.target.value)
          }
        />
      </div>
    </div>
  );
}
