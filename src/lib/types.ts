/** Compact store format from stores.json */
export interface StoreRaw {
  id: number;
  n: string;
  d: string;
  c: string;
  ci: string;
  co: string;
  cn: string;
  la: number;
  ln: number;
  r: number;
  w: string;
  ig: string;
  t: string;
  imgs: string[];
}

/** Expanded store for use in components */
export interface Store {
  id: number;
  name: string;
  description: string;
  category: string;
  city: string;
  country: string;
  continent: string;
  lat: number;
  lng: number;
  rating: number;
  website: string;
  instagram: string;
  tags: string;
  images: string[];
}

export interface DatasetStats {
  stores: number;
  cities: number;
  countries: number;
  continents: number;
}

export function hasStoreCoordinates(store: Pick<Store, "lat" | "lng">) {
  return Number.isFinite(store.lat) && Number.isFinite(store.lng);
}

export function expandStore(raw: StoreRaw): Store {
  return {
    id: raw.id,
    name: raw.n,
    description: raw.d,
    category: raw.c,
    city: raw.ci,
    country: raw.co,
    continent: raw.cn,
    lat: raw.la,
    lng: raw.ln,
    rating: raw.r,
    website: raw.w,
    instagram: raw.ig,
    tags: raw.t,
    images: raw.imgs || [],
  };
}

export const CATEGORIES = [
  { key: "clothing", label: "Clothing" },
  { key: "accessories", label: "Accessories" },
  { key: "shoes", label: "Shoes" },
  { key: "books", label: "Books" },
  { key: "music", label: "Music" },
  { key: "film", label: "Film" },
  { key: "design-objects", label: "Design Objects" },
  { key: "art", label: "Art & Prints" },
  { key: "retrogaming", label: "Retrogaming" },
  { key: "action-figures", label: "Action Figures" },
  { key: "flea_market", label: "Flea Market" },
] as const;

export const DEFAULT_STATS: DatasetStats = {
  stores: 9037,
  cities: 233,
  countries: 59,
  continents: 6,
} as const;

export function formatCategoryLabel(category: string) {
  const found = CATEGORIES.find((item) => item.key === category);
  if (found) return found.label;

  return category
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
