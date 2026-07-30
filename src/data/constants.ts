import { User, MapPin, Lock, ShoppingBag, Heart, LogOut } from "lucide-react";
import { Section } from "./types";

export const LOAD_MORE_LIMIT = 16;
export const CATEGORY_LIMIT = 50;
export const INDUSTRY_LIMIT = 50;
export const SESSION_STORAGE_KEY = "activeSelection";

export const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];
export const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors";
export const NAV_ITEMS: { key: Section; label: string; icon: any }[] = [
  { key: "profile", label: "Profile Information", icon: User },
  { key: "addresses", label: "Saved Addresses", icon: MapPin },
  { key: "password", label: "Change Password", icon: Lock },
  { key: "orders", label: "My Orders", icon: ShoppingBag },
  { key: "saved", label: "Saved Items", icon: Heart },
  { key: "logout", label: "Logout", icon: LogOut },
];
export const COLOR_OPTIONS: { name: string; hex: string }[] = [
  { name: "Black", hex: "#111111" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Gray", hex: "#9CA3AF" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Navy", hex: "#1E3A8A" },
  { name: "Red", hex: "#DC2626" },
  { name: "Green", hex: "#16A34A" },
  { name: "Olive", hex: "#708238" },
  { name: "Yellow", hex: "#FACC15" },
  { name: "Orange", hex: "#F97316" },
  { name: "Purple", hex: "#7C3AED" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Brown", hex: "#8B5E3C" },
  { name: "Beige", hex: "#E8DCC8" },
  { name: "Gold", hex: "#D4AF37" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Teal", hex: "#0D9488" },
  { name: "Maroon", hex: "#800000" },
  { name: "Mushroom", hex: "#B79A81" },
];

export const GENDER_KEYWORDS: Record<string, string[]> = {
  MEN: ["men", "mens", "men's"],
  WOMEN: ["women", "ladies", "female", "women's"],
  YOUTH: ["youth"],
  TODDLER: ["toddler"],
  INFANT: ["infant", "baby"],
  UNISEX: ["unisex"],
};

export const FABRIC_KEYWORDS: Record<string, string[]> = {
  COTTON: ["cotton"],
  POLYESTER: ["polyester"],
  FLEECE: ["fleece"],
  CANVAS: ["canvas"],
  DENIM: ["denim"],
  NYLON: ["nylon"],
};

export const GENDER_OPTIONS = Object.keys(GENDER_KEYWORDS);
export const FABRIC_OPTIONS = Object.keys(FABRIC_KEYWORDS);

export const PRICE_MIN = 0;
export const PRICE_MAX = 500;
export const PRICE_STEP = 5;

// ─────────────────────────────────────────────────────────────────────────
// USE CASE COLLECTIONS — hardcoded on the frontend (intentionally NOT
// sourced from IndustryApi). Purely a browsing/entry-point layer: picking a
// use case here just pre-checks the matching real sub-categories (via
// `matchCategoriesForKeywords` + `activeParents`, the SAME mechanism the
// plain Category-tree checkboxes use), so it filters through the existing
// product grid with zero new API surface.
// ─────────────────────────────────────────────────────────────────────────
