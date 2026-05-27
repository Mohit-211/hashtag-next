export interface Brand {
  id: number;
  name: string;
  slug: string;
}

export const brandlist: Brand[] = [
  { id: 1, name: "Raymond",        slug: "raymond" },
  { id: 2, name: "Louis Philippe", slug: "louis-philippe" },
  { id: 3, name: "Allen Solly",    slug: "allen-solly" },
  { id: 4, name: "Peter England",  slug: "peter-england" },
  { id: 5, name: "Van Heusen",     slug: "van-heusen" },
  { id: 6, name: "Blackberrys",    slug: "blackberrys" },
  { id: 7, name: "Indian Terrain", slug: "indian-terrain" },
  { id: 8, name: "Mufti",          slug: "mufti" },
];

export const BRAND_TAB_NAME = "Brands"; // must match category name from API