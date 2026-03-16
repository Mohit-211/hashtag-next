// data/products.ts

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
    image: "/assets/product-tshirt.jpg",
    name: "Essential Black Tee",
    price: 799,
    originalPrice: 999,
    badge: "SALE",
    customizable: true,
    category: "T-Shirts",
  },
  {
    image: "/assets/product-hoodie.jpg",
    name: "Classic White Hoodie",
    price: 1899,
    customizable: true,
    category: "Hoodies",
  },
  {
    image: "/assets/product-cap.jpg",
    name: "Stealth Snapback Cap",
    price: 599,
    badge: "NEW",
    customizable: true,
    category: "Caps",
  },
  {
    image: "/assets/product-joggers.jpg",
    name: "Urban Joggers",
    price: 1999,
    originalPrice: 2499,
    customizable: false,
    category: "Bottoms",
  },
  {
    image: "/assets/product-tote.jpg",
    name: "Canvas Tote Bag",
    price: 549,
    customizable: true,
    category: "Accessories",
  },
  {
    image: "/assets/product-socks.jpg",
    name: "Crew Socks Pack",
    price: 399,
    customizable: false,
    category: "Accessories",
  },
  {
    image: "/assets/product-mug.jpg",
    name: "Custom Ceramic Mug",
    price: 449,
    customizable: true,
    category: "Accessories",
  },
  {
    image: "/assets/product-phonecase.jpg",
    name: "Matte Phone Case",
    price: 699,
    badge: "NEW",
    customizable: true,
    category: "Accessories",
  },
  {
    image: "/assets/product-tshirt.jpg",
    name: "Signature Logo Tee",
    price: 999,
    customizable: true,
    category: "T-Shirts",
  },
  {
    image: "/assets/product-hoodie.jpg",
    name: "Oversized Zip Hoodie",
    price: 2999,
    badge: "NEW",
    customizable: true,
    category: "Hoodies",
  },
  {
    image: "/assets/product-tote2.jpg",
    name: "Premium Tote Bag",
    price: 749,
    customizable: true,
    category: "Accessories",
  },
  {
    image: "/assets/product-cap.jpg",
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
