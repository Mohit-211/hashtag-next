"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";

import { UserProfileApi } from "@/api/users/users.api";
import { loginApi } from "@/api/auth/auth.api";

export interface User {
  name: string;
  email: string;
  mobile?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load user from API if token exists
  const fetchUser = async () => {
    try {
      const res = await UserProfileApi();
      console.log(res, "res")
      const data = res?.data?.data;
      console.log(data, "data")
      const formattedUser: User = {
        name: data?.user_profile?.name,
        email: data?.email,
        mobile: data?.user_profile.mobile,
      };
console.log(formattedUser,"formattedUser")
      setUser(formattedUser);
    } catch (error) {
      console.error("Profile fetch failed", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // ✅ On app load
  useEffect(() => {
    const token = localStorage.getItem("hastagBillionaire");
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  // ✅ LOGIN
  // Retries on a "not verified" response: right after OTP verification the
  // backend can take a moment to make that write visible to the login read
  // (replica lag / cache), so the very next login can spuriously see the
  // account as unverified. A couple of short retries absorb that lag
  // without masking a genuinely unverified account.
  const login = useCallback(async (email: string, password: string) => {
    const MAX_NOT_VERIFIED_RETRIES = 4;
    const RETRY_DELAY_MS = 900;
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 0; ; attempt++) {
      try {
        const res = await loginApi({ email, password });

        const token = res?.data?.data?.tokens?.access?.token;

        if (!token) {
          return { success: false, error: "Invalid response from server" };
        }

        // ✅ Store token (same key everywhere)
        localStorage.setItem("hastagBillionaire", token);

        // ✅ Fetch user AFTER login
        // await fetchUser();

        return { success: true };
      } catch (err: any) {
        const message = err?.response?.data?.message || "Login failed";
        const isNotVerified = message.toLowerCase().includes("not verified");

        if (isNotVerified && attempt < MAX_NOT_VERIFIED_RETRIES) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }

        return { success: false, error: message };
      }
    }
  }, []);

  // ✅ LOGOUT
  const logout = useCallback(() => {
    localStorage.removeItem("hastagBillionaire");
    setUser(null);
  }, []);

  if (loading) return null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};