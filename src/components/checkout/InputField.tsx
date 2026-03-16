const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm";

const InputField = ({ placeholder, value, onChange, error, type = "text" }) => {
  return (
    <div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`${inputClass} ${error ? "border-destructive" : ""}`}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
};

export default InputField;
