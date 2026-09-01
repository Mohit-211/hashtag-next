export type PhotoCategory =
  | "All"
  | "Bags"
  | "Caps"
  | "Hoodies"
  | "Tshirts"
  | "Bibs"
  | "Uniforms"
  | "Accessories";

export interface Photo {
  id: number;
  name: string;
  src: string;
  category: Exclude<PhotoCategory, "All">;
}

export const CATEGORIES: PhotoCategory[] = [
  "All",
  "Bags",
  "Caps",
  "Hoodies",
  "Tshirts",
  "Bibs",
  "Uniforms",
  "Accessories",
];

export const PHOTOS: Photo[] = [
  { id: 1,  name: "bags",     src: "/assets/GalleryImage/bags.png",      category: "Bags" },
  { id: 2,  name: "IMG_0357", src: "/assets/GalleryImage/IMG_0357.jpg",  category: "Caps" },
  { id: 3,  name: "IMG_0395", src: "/assets/GalleryImage/IMG_0395.jpg",  category: "Hoodies" },
  { id: 4,  name: "IMG_0450", src: "/assets/GalleryImage/IMG_0450.jpg",  category: "Tshirts" },
  { id: 5,  name: "IMG_0480", src: "/assets/GalleryImage/IMG_0480.jpg",  category: "Bibs" },
  { id: 6,  name: "IMG_0493", src: "/assets/GalleryImage/IMG_0493.jpg",  category: "Uniforms" },
  { id: 7,  name: "IMG_0559", src: "/assets/GalleryImage/IMG_0559.jpg",  category: "Accessories" },
  { id: 8,  name: "IMG_0596", src: "/assets/GalleryImage/IMG_0596.jpg",  category: "Bags" },
  { id: 9,  name: "IMG_0597", src: "/assets/GalleryImage/IMG_0597.jpg",  category: "Caps" },
  { id: 10, name: "IMG_0598", src: "/assets/GalleryImage/IMG_0598.jpg",  category: "Hoodies" },
  { id: 11, name: "IMG_0599", src: "/assets/GalleryImage/IMG_0599.jpg",  category: "Tshirts" },
  { id: 12, name: "IMG_0615", src: "/assets/GalleryImage/IMG_0615.jpg",  category: "Bibs" },
  { id: 13, name: "IMG_1193", src: "/assets/GalleryImage/IMG_1193.jpg",  category: "Uniforms" },
  { id: 14, name: "IMG_2241", src: "/assets/GalleryImage/IMG_2241.jpg",  category: "Accessories" },
  { id: 15, name: "IMG_2244", src: "/assets/GalleryImage/IMG_2244.jpg",  category: "Bags" },
  { id: 16, name: "IMG_2518", src: "/assets/GalleryImage/IMG_2518.jpg",  category: "Caps" },
  { id: 17, name: "IMG_2532", src: "/assets/GalleryImage/IMG_2532.jpg",  category: "Hoodies" },
  { id: 18, name: "IMG_2876", src: "/assets/GalleryImage/IMG_2876.jpg",  category: "Tshirts" },
  { id: 19, name: "IMG_3527", src: "/assets/GalleryImage/IMG_3527.jpg",  category: "Bibs" },
  { id: 20, name: "IMG_3590", src: "/assets/GalleryImage/IMG_3590.jpg",  category: "Uniforms" },
  { id: 21, name: "IMG_4039", src: "/assets/GalleryImage/IMG_4039.jpg",  category: "Accessories" },
  { id: 22, name: "IMG_4086", src: "/assets/GalleryImage/IMG_4086.jpg",  category: "Bags" },
  { id: 23, name: "IMG_4140", src: "/assets/GalleryImage/IMG_4140.jpg",  category: "Caps" },
  { id: 24, name: "IMG_4151", src: "/assets/GalleryImage/IMG_4151.jpg",  category: "Hoodies" },
  { id: 25, name: "IMG_4152", src: "/assets/GalleryImage/IMG_4152.jpg",  category: "Tshirts" },
  { id: 26, name: "IMG_4218", src: "/assets/GalleryImage/IMG_4218.jpg",  category: "Bibs" },
  { id: 27, name: "IMG_4262", src: "/assets/GalleryImage/IMG_4262.jpg",  category: "Uniforms" },
  { id: 28, name: "IMG_8167", src: "/assets/GalleryImage/IMG_8167.jpg",  category: "Accessories" },
  { id: 29, name: "IMG_8978", src: "/assets/GalleryImage/IMG_8978.jpg",  category: "Bags" },
  { id: 30, name: "IMG_9251", src: "/assets/GalleryImage/IMG_9251.jpg",  category: "Caps" },
  { id: 31, name: "IMG_9398", src: "/assets/GalleryImage/IMG_9398.jpg",  category: "Hoodies" },
  { id: 32, name: "IMG_9524", src: "/assets/GalleryImage/IMG_9524.jpg",  category: "Tshirts" },
  { id: 33, name: "IMG_9544", src: "/assets/GalleryImage/IMG_9544.jpg",  category: "Bibs" },
  { id: 34, name: "IMG_9545", src: "/assets/GalleryImage/IMG_9545.jpg",  category: "Uniforms" },
  { id: 35, name: "IMG_9826", src: "/assets/GalleryImage/IMG_9826.jpg",  category: "Accessories" },
];
