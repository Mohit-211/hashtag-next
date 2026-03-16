"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, User, Menu, X, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "All Products", href: "/categories" },
  { label: "Orders", href: "/orders" },
  { label: "Saved", href: "/saved" },
  { label: "Track Order", href: "/track-order" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const pathname = usePathname();
  const { totalItems } = useCart();
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
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
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === link.href
                  ? "text-primary-foreground bg-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-foreground">
            <Search className="h-5 w-5" />
          </Button>

          <Link href="/saved">
            <Button variant="ghost" size="icon" className="text-foreground">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/cart" className="relative">
            <Button variant="ghost" size="icon" className="text-foreground">
              <ShoppingBag className="h-5 w-5" />
            </Button>

            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <Link href="/account" className="hidden sm:flex items-center gap-1">
              <span className="text-xs text-muted-foreground max-w-[100px] truncate">
                {user?.name?.split(" ")[0]}
              </span>

              <Button variant="ghost" size="icon" className="text-foreground">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex text-foreground"
              >
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <nav className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  pathname === link.href
                    ? "text-primary-foreground bg-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
              >
                My Account ({user?.name?.split(" ")[0]})
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
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
