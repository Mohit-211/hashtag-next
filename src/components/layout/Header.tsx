"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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

import { Badge } from "antd";

import { Button } from "@/components/ui/button";

import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "All Products", href: "/categories" },
  { label: "Orders", href: "/orders" },
  { label: "Saved", href: "/saved" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact-us" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  // ✅ Search
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();

  const { totalItems } = useCart();
  useEffect(() => {
    console.log("Header Cart Count:", totalItems);
  }, [totalItems]);
  const { wishlistCount } = useWishlist();

  const { user, logout } = useAuth();

  // ✅ SINGLE CONDITION
  const isLoggedIn =
    typeof window !== "undefined" &&
    !!localStorage.getItem("hastagBillionaire");

  // ✅ Needed because createPortal can't run during SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Close dropdown on outside click — checks BOTH the trigger and the
  // portaled dropdown, since the dropdown is no longer a DOM descendant
  // of the trigger's wrapping div.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);
      if (!clickedTrigger && !clickedDropdown) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Close menu on route change
  useEffect(() => {
    setUserDropdownOpen(false);
    setMobileOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

  // ✅ Recalculate position on scroll/resize while open, so it doesn't
  // drift out of place under the trigger.
  useEffect(() => {
    if (!userDropdownOpen) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownRect({ top: rect.bottom + 8, left: rect.right - 224 }); // 224px = w-56
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [userDropdownOpen]);

  const toggleDropdown = () => {
    if (!userDropdownOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownRect({ top: rect.bottom + 8, left: rect.right - 224 });
    }
    setUserDropdownOpen((prev) => !prev);
  };

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("hastagBillionaire");
    logout();
    setUserDropdownOpen(false);
    setMobileOpen(false);
    router.push("/login");
  };

  // ✅ Search submit — matches AllProductsApi's ProductQueryParams shape
const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  const search = searchQuery.trim().replace(/\s+/g, " ");

  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("limit", "16");

  if (search) {
    params.set("search", search);
  }

  router.push(`/categories?${params.toString()}`, { scroll: false });
  setMobileSearchOpen(false);
};
  return (
    <header className="sticky top-0 z-50 bg-gray-500/50 backdrop-blur border-b border-gray-500">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/logo_footer.png"
            alt="HashtagBillionaire"
            width={180}
            height={30}
            priority
            className="h-12 w-auto"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 shrink-0">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === link.href
                  ? "text-primary-foreground bg-primary"
                  : "  hover:text-foreground hover:bg-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search Bar (Desktop) */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden lg:flex flex-1 max-w-md"
        >
         <div className="relative w-full">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <input
    type="text"
    autoFocus
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search for products, styles, brands..."
    className="w-full h-9 rounded-md border border-border bg-secondary/60 pl-9 pr-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition"
  />
  {searchQuery && (
    <button
      type="button"
      onClick={() => setSearchQuery("")}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
      aria-label="Clear search"
    >
      <X className="h-4 w-4" />
    </button>
  )}
</div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Mobile Search Toggle */}
          <button
            type="button"
            className="lg:hidden rounded-md p-1.5 hover:bg-secondary/70 transition"
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            aria-label="Toggle search"
          >
            {mobileSearchOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </button>

          {/* ================= LOGGED IN ================= */}
          {isLoggedIn ? (
            <>
              {/* Wishlist */}
              <Link href="/saved">
                <Badge count={wishlistCount} size="small" offset={[0, 4]}>
                  <div className="rounded-md hover:bg-secondary transition">
                    <Heart className="h-5 w-5" />
                  </div>
                </Badge>
              </Link>

              {/* Cart */}
              <Link href="/cart">
                <Badge count={totalItems} size="small" offset={[0, 4]}>
                  <div className="rounded-md hover:bg-secondary transition">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                </Badge>
              </Link>

              {/* User Dropdown trigger — NOTE: no wrapping ref div anymore,
                  the ref lives directly on the button. */}
              <div className="relative hidden sm:block">
                <button
                  ref={triggerRef}
                  onClick={toggleDropdown}
                  className="
                    flex items-center gap-1.5 px-2.5 py-1.5
                    rounded-md hover:bg-secondary/70
                    transition
                  "
                >
                  <span className="text-xs   max-w-[80px] truncate">
                    {user?.name?.split(" ")[0] || "Account"}
                  </span>
                  <User className="h-5 w-5" />
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      userDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown — rendered via portal directly into <body>,
                    so it escapes the header's sticky/backdrop-blur
                    stacking & clipping context entirely. */}
                {mounted &&
                  userDropdownOpen &&
                  createPortal(
                    <div
                      ref={dropdownRef}
                      style={{
                        position: "fixed",
                        top: dropdownRect.top,
                        left: dropdownRect.left,
                        zIndex: 10001,
                      }}
                      className="w-56 rounded-xl border bg-background shadow-xl py-1 animate-in fade-in zoom-in-95"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b">
                        <p className="text-sm font-medium truncate">
                          {user?.name || "User"}
                        </p>
                        <p className="text-xs   truncate">
                          {user?.email || ""}
                        </p>
                      </div>

                      {/* Profile */}
                      <Link
                        href="/account"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary/60 transition"
                      >
                        <UserCircle className="h-4 w-4" />
                        My Profile
                      </Link>
                      <Link
                        href="/payment-history"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary/60 transition"
                      >
                        <UserCircle className="h-4 w-4" />
                        Payment History
                      </Link>

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>,
                    document.body
                  )}
              </div>
            </>
          ) : (
            /* ================= NOT LOGGED IN ================= */
            <Link href="/login">
              <Button
                variant="default"
                size="sm"
                className="hidden sm:flex cursor-pointer"
              >
                Login
              </Button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-secondary/70 transition"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* ================= MOBILE SEARCH BAR ================= */}
      {mobileSearchOpen && (
        <div className="lg:hidden border-t bg-background px-4 py-3">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, styles, brands..."
                className="w-full h-9 rounded-md border border-border bg-secondary/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition"
              />
            </div>
          </form>
        </div>
      )}

      {/* ================= MOBILE MENU ================= */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 text-sm rounded-md ${
                  pathname === link.href
                    ? "bg-primary text-white"
                    : "  hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {isLoggedIn ? (
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