"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  Heart,
  LogOut,
  UserCircle,
  ChevronDown,

} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, Badge } from "antd";
import { useWishlist } from "@/contexts/WishlistContext";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "All Products", href: "/categories" },
  { label: "Orders", href: "/orders" },
  { label: "Saved", href: "/saved" },
  { label: "Track Order", href: "/track-order" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  console.log(isAuthenticated, "isAuthenticated")

  // ✅ Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Close dropdown on route change
  useEffect(() => {
    setUserDropdownOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // ✅ Logout handler
  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    setMobileOpen(false);
    router.push("/login");
  };
  console.log(totalItems, "totalItems")
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/logo_header.png"
            alt="HashtagBillionaire"
            width={180}
            height={40}
            priority
            className="h-12 w-auto"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname === link.href
                ? "text-primary-foreground bg-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">

  {/* Search */}
  <Button
    variant="ghost"
    size="icon"
    className="hover:bg-secondary/70 transition"
  >
    <Search className="h-7 w-7" />
  </Button>

 
 <Link href="/saved">
  <Badge count={wishlistCount} size="small" offset={[0, 4]}>
    <div className=" rounded-md hover:bg-secondary transition">
      <Heart className="h-5 w-5" />
    </div>
  </Badge>
</Link>
  {/* Cart */}
 <Link href="/cart">
  <Badge count={totalItems} size="small" offset={[0, 4]}>
    <div className=" rounded-md hover:bg-secondary transition">
      <ShoppingBag className="h-5 w-5" />
    </div>
  </Badge>
</Link>

  {/* USER SECTION */}
  {isAuthenticated ? (
    <div className="relative hidden sm:block" ref={dropdownRef}>
      <button
        onClick={() => setUserDropdownOpen((prev) => !prev)}
        className="
          flex items-center gap-1.5 px-2.5 py-1.5
          rounded-md
          hover:bg-secondary/70
          transition
        "
      >
        <span className="text-xs text-muted-foreground max-w-[80px] truncate">
          {user?.name?.split(" ")[0] || "User"}
        </span>

        <User className="h-5 w-5" />

        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            userDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {userDropdownOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border bg-background shadow-xl py-1 z-50 animate-in fade-in zoom-in-95">

          {/* User Info */}
          <div className="px-4 py-2 border-b">
            <p className="text-sm font-medium truncate">
              {user?.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>

          {/* Profile */}
          <Link
            href="/account"
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary/60 transition"
          >
            <UserCircle className="h-4 w-4" />
            Profile
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  ) : (
    <Link href="/login">
      <Button
        variant="ghost"
        size="icon"
        className="hidden sm:flex hover:bg-secondary/70 transition"
      >
        <User className="h-5 w-5" />
      </Button>
    </Link>
  )}

  {/* Mobile Menu */}
  <Button
    variant="ghost"
    size="icon"
    className="md:hidden hover:bg-secondary/70 transition"
    onClick={() => setMobileOpen((prev) => !prev)}
  >
    {mobileOpen ? (
      <X className="h-5 w-5" />
    ) : (
      <Menu className="h-5 w-5" />
    )}
  </Button>

</div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 text-sm rounded-md ${pathname === link.href
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-secondary"
                  }`}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 text-sm hover:bg-secondary rounded-md"
                >
                  My Account ({user?.name?.split(" ")[0] || "User"})
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-sm hover:bg-secondary rounded-md"
              >
                Login / Register
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}