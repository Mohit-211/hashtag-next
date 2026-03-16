import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm";

const PasswordInput = ({ value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`${inputClass} pr-10`}
      />

      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

export default PasswordInput;
