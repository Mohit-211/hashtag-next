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
import { resetSessionExpired } from "@/errors/ApiErrorHandler";

import { isAxiosError } from "axios";
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
  ) => Promise<{ success: boolean; error?: string; status?: number }>;
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
  // Bumped to load the profile again after a failure that kept the session.
  const [profileAttempt, setProfileAttempt] = useState(0);

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
    let retry: (() => void) | null = null;
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
        if (cancelled) return;
        // 401: the API rejected the token. ApiErrorHandler has already removed it
        // and sent the user to login; logout() only brings this tab's state in line.
        if (isAxiosError(error) && error.response?.status === 401) {
          logout();
          return;
        }
        // Offline, timeout, 5xx and the like say nothing about the token: keep the
        // session and try again when the user comes back or the connection returns.
        retry = () => setProfileAttempt((n) => n + 1);
        window.addEventListener("online", retry, { once: true });
        window.addEventListener("focus", retry, { once: true });
      });
    return () => {
      cancelled = true;
      if (retry) {
        window.removeEventListener("online", retry);
        window.removeEventListener("focus", retry);
      }
    };
  }, [isLoggedIn, logout, profileAttempt]);

  // An unverified account answers 403 with a message; the form offers to
  // resend the verification link.
  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await loginApi({ email, password, role_id: 6 });
      const token = res?.data?.data?.tokens?.access?.token;
      if (!token) return { success: false, error: "Invalid response from server" };
      localStorage.setItem("hastagBillionaire", token);
      // A new session: when it expires, the expiry handler must run again.
      resetSessionExpired();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: apiMessage(err) || "We couldn't log you in. Please try again.",
        status: isAxiosError(err) ? err.response?.status : undefined,
      };
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