"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { useIsLoggedIn } from "@/hooks/useIsLoggedIn";

import { UserProfileApi } from "@/api/users/users.api";
import { loginApi } from "@/api/auth/auth.api";
import { clearPendingAuthAction, notifyAuthChanged } from "@/lib/authRedirect";

import { apiMessage } from "@/lib/errors";
export interface User {
  id: string | number;
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
  const isLoggedIn = useIsLoggedIn();
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem("hastagBillionaire");
    // A new login must not resume something started in the previous session.
    clearPendingAuthAction();
    setUser(null);
    notifyAuthChanged();
  }, []);

  // Load the profile whenever a session starts — on page load with a stored
  // token, and right after logging in (LoginForm fires the auth-changed event).
  // The app renders immediately; only `user` fills in when this resolves.
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    UserProfileApi()
      .then((res) => {
        if (cancelled) return;
        const data = res?.data?.data;
        setUser({
          id: data?.id ?? data?._id,
          name: data?.user_profile?.name,
          email: data?.email,
          mobile: data?.user_profile?.mobile,
        });
      })
      .catch((error) => {
        console.error("Profile fetch failed", error);
        if (!cancelled) logout();
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, logout]);

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
        const res = await loginApi({ email, password, role_id: 6 });

        const token = res?.data?.data?.tokens?.access?.token;

        if (!token) {
          return { success: false, error: "Invalid response from server" };
        }

        // ✅ Store token (same key everywhere)
        localStorage.setItem("hastagBillionaire", token);

        // ✅ Fetch user AFTER login
        // await fetchUser();

        return { success: true };
      } catch (err) {
        const message = apiMessage(err) || "Login failed";
        const isNotVerified = message.toLowerCase().includes("not verified");

        if (isNotVerified && attempt < MAX_NOT_VERIFIED_RETRIES) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }

        return { success: false, error: message };
      }
    }
  }, []);


  return (
    <AuthContext.Provider
      value={{
        // A token removed elsewhere (e.g. the expired-session handler) clears the user too.
        user: isLoggedIn ? user : null,
        isAuthenticated: isLoggedIn && !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};