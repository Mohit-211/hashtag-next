import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";

import AccountSidebar from "@/components/account/AccountSidebar";
import ProfileSection from "@/components/account/ProfileSection";
import AddressSection from "@/components/account/AddressSection";
import PasswordSection from "@/components/account/PasswordSection";
import LoginRequired from "@/components/account/LoginRequired";

import { Section } from "@/data/types";

const Account = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [active, setActive] = useState<Section>("profile");

  if (!isAuthenticated) {
    return (
      <Layout>
        <LoginRequired onLogin={() => navigate("/login")} />
      </Layout>
    );
  }

  const handleNav = (key: Section) => {
    if (key === "orders") return navigate("/orders");
    if (key === "saved") return navigate("/saved");

    if (key === "logout") {
      logout();
      navigate("/");
      return;
    }

    setActive(key);
  };

  return (
    <Layout>
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
    </Layout>
  );
};

export default Account;
