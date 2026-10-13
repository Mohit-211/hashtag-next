/**
 * Grand-category titles exactly as the API returns them
 * (`product-category/get-grand-categories`). The grand category decides which
 * purchase flow a product uses, so every check goes through `isGrandCategory`
 * — compared case- and whitespace-insensitively so a casing tweak in the admin
 * panel doesn't silently switch flows.
 */
export const GRAND_CATEGORY = {
  apparel: "Apparel & Uniforms",
  preMade: "Pre-Made products",
  promo: "Promo Products",
} as const;

export type GrandCategoryKey = keyof typeof GRAND_CATEGORY;

const normalize = (title: string | null | undefined) => (title ?? "").trim().replace(/\s+/g, " ").toLowerCase();

export const isGrandCategory = (title: string | null | undefined, key: GrandCategoryKey): boolean =>
  normalize(title) === normalize(GRAND_CATEGORY[key]);
