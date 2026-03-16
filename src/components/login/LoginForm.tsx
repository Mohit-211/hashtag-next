import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import PasswordInput from "./PasswordInput";
import DemoCredentials from "./DemoCredentials";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm";

const LoginForm = ({ switchToRegister }) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const result = login(email.trim(), password);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "Login failed");
    }
  };

  return (
    <>
      <div className="text-center space-y-1">
        <h1 className="text-xl font-heading font-bold">Welcome Back</h1>
        <p className="text-sm text-muted-foreground">
          Log in to continue shopping.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />

        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />

        <div className="flex justify-between items-center">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={remember}
              onCheckedChange={(v) => setRemember(!!v)}
            />
            <span className="text-sm text-muted-foreground">Remember me</span>
          </label>

          <button
            type="button"
            className="text-sm text-muted-foreground hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" variant="hero" size="lg" className="w-full">
          Login
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        Don't have an account?{" "}
        <button
          onClick={switchToRegister}
          className="font-semibold hover:underline"
        >
          Sign Up
        </button>
      </p>

      <DemoCredentials />
    </>
  );
};

export default LoginForm;
