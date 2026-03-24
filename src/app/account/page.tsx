"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

import AccountSidebar from "@/components/account/AccountSidebar";
import ProfileSection from "@/components/account/ProfileSection";
import AddressSection from "@/components/account/AddressSection";
import PasswordSection from "@/components/account/PasswordSection";
import LoginRequired from "@/components/account/LoginRequired";

import { Section } from "@/data/types";

export default function Account() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const [active, setActive] = useState<Section>("profile");

  // if (!isAuthenticated) {
  //   return (
  //     <section className="py-10 lg:py-16">
  //       <div className="container">
  //         <LoginRequired onLogin={() => router.push("/login")} />
  //       </div>
  //     </section>
  //   );
  // }

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

          {active === "addresses" && <AddressSection />}

          {active === "password" && <PasswordSection />}
        </div>
      </div>
    </section>
  );
}
