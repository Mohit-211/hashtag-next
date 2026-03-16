import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface User {
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (name: string, email: string, phone: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const DEMO_EMAIL = "demo@hashtagbillionaire.com";
const DEMO_PASSWORD = "demo123";
const DEMO_USER: User = { name: "Demo User", email: DEMO_EMAIL, phone: "9876543210" };

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((email: string, password: string) => {
    if (email.toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setUser(DEMO_USER);
      return { success: true };
    }
    // Accept any registered mock user
    const stored = sessionStorage.getItem(`user_${email.toLowerCase()}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.password === password) {
        setUser({ name: parsed.name, email: parsed.email, phone: parsed.phone });
        return { success: true };
      }
      return { success: false, error: "Incorrect password. Please try again." };
    }
    return { success: false, error: "No account found with this email. Please sign up." };
  }, []);

  const register = useCallback((name: string, email: string, phone: string, password: string) => {
    if (email.toLowerCase() === DEMO_EMAIL) {
      return { success: false, error: "This email is already registered. Please log in." };
    }
    const existing = sessionStorage.getItem(`user_${email.toLowerCase()}`);
    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }
    sessionStorage.setItem(`user_${email.toLowerCase()}`, JSON.stringify({ name, email, phone, password }));
    setUser({ name, email, phone });
    return { success: true };
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
