import InputField from "./InputField";

const ContactSection = ({ form, update }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-heading font-semibold">
        Contact Information
      </h2>

      <InputField
        placeholder="Full Name"
        value={form.fullName}
        onChange={(e) => update("fullName", e.target.value)}
      />

      <div className="grid sm:grid-cols-2 gap-3">
        <InputField
          placeholder="Email Address"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />

        <InputField
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
      </div>
    </div>
  );
};

export default ContactSection;
