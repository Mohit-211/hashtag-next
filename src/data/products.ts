import productTshirt from "@/assets/product-tshirt.jpg";
import productHoodie from "@/assets/product-hoodie.jpg";
import productCap from "@/assets/product-cap.jpg";
import productJoggers from "@/assets/product-joggers.jpg";
import productTote from "@/assets/product-tote.jpg";
import productSocks from "@/assets/product-socks.jpg";
import productMug from "@/assets/product-mug.jpg";
import productPhonecase from "@/assets/product-phonecase.jpg";
import productTote2 from "@/assets/product-tote2.jpg";

export interface Product {
  image: string;
  name: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  customizable?: boolean;
  category: string;
}

export const products: Product[] = [
  {
    image: productTshirt,
    name: "Essential Black Tee",
    price: 799,
    originalPrice: 999,
    badge: "SALE",
    customizable: true,
    category: "T-Shirts",
  },
  {
    image: productHoodie,
    name: "Classic White Hoodie",
    price: 1899,
    customizable: true,
    category: "Hoodies",
  },
  {
    image: productCap,
    name: "Stealth Snapback Cap",
    price: 599,
    badge: "NEW",
    customizable: true,
    category: "Caps",
  },
  {
    image: productJoggers,
    name: "Urban Joggers",
    price: 1999,
    originalPrice: 2499,
    customizable: false,
    category: "Bottoms",
  },
  {
    image: productTote,
    name: "Canvas Tote Bag",
    price: 549,
    customizable: true,
    category: "Accessories",
  },
  {
    image: productSocks,
    name: "Crew Socks Pack",
    price: 399,
    customizable: false,
    category: "Accessories",
  },
  {
    image: productMug,
    name: "Custom Ceramic Mug",
    price: 449,
    customizable: true,
    category: "Accessories",
  },
  {
    image: productPhonecase,
    name: "Matte Phone Case",
    price: 699,
    badge: "NEW",
    customizable: true,
    category: "Accessories",
  },
  {
    image: productTshirt,
    name: "Signature Logo Tee",
    price: 999,
    customizable: true,
    category: "T-Shirts",
  },
  {
    image: productHoodie,
    name: "Oversized Zip Hoodie",
    price: 2999,
    badge: "NEW",
    customizable: true,
    category: "Hoodies",
  },
  {
    image: productTote2,
    name: "Premium Tote Bag",
    price: 749,
    customizable: true,
    category: "Accessories",
  },
  {
    image: productCap,
    name: "Classic Fitted Cap",
    price: 649,
    customizable: true,
    category: "Caps",
  },
];

export const subcategories = [
  "All",
  "T-Shirts",
  "Hoodies",
  "Caps",
  "Bottoms",
  "Accessories",
];

export const sortOptions = [
  { label: "Popular", value: "popular" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Newest", value: "newest" },
];
