import { User, MapPin, Lock, ShoppingBag, Heart, LogOut } from "lucide-react";
import { Section } from "./types";

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
