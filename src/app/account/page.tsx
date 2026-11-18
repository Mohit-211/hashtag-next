"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useIsClient } from "@/hooks/useIsClient";
import { useIsLoggedIn } from "@/hooks/useIsLoggedIn";
import { loginUrl } from "@/lib/authRedirect";

import AccountSidebar from "@/components/account/AccountSidebar";
import ProfileSection from "@/components/account/ProfileSection";
import AddressSection from "@/components/account/AddressSection";
import PasswordSection from "@/components/account/PasswordSection";
import SavedGraphicsSection from "@/components/account/SavedGraphicsSection";
import { Section } from "@/data/types";


export default function Account() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  // A session token is stored (not proof it is valid - see isAuthenticated).
  const isLoggedIn = useIsLoggedIn();
  const isClient = useIsClient();
  // Logging out from this page goes home, not to the login redirect below.
  const loggingOutRef = useRef(false);

  const [active, setActive] = useState<Section>("profile");

  // No token - never signed in, signed out in another tab, or cleared after the
  // API rejected it - so go to login and come back here afterwards.
  useEffect(() => {
    if (isClient && !isLoggedIn && !loggingOutRef.current) {
      router.replace(loginUrl("/account"));
    }
  }, [isClient, isLoggedIn, router]);

  // Show nothing from the account until the API has accepted the token:
  // isAuthenticated = token stored AND the profile request succeeded.
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-28 gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        {isClient && !isLoggedIn ? "Redirecting to login…" : "Checking your session…"}
      </div>
    );
  }

  const handleNav = (key: Section) => {
    if (key === "orders") {
      router.push("/orders");
      return;
    }

    if (key === "saved") {
      router.push("/saved");
      return;
    }

    if (key === "logout") {
      loggingOutRef.current = true;
      logout();
      router.push("/");
      return;
    }

    setActive(key);
  };

  return (
    <section className="py-10 lg:py-16">
      <div className="container flex flex-col lg:flex-row gap-8">
        <AccountSidebar active={active} onNavigate={handleNav} user={user} />

        <div className="flex-1">
          {active === "profile" && <ProfileSection user={user} />}

          {active === "addresses" && <AddressSection mode="manage" />}

          {active === "graphics" && <SavedGraphicsSection />}

          {active === "password" && <PasswordSection />}
        </div>
      </div>
    </section>
  );
}
