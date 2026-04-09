/**
 * Convert the curated Uppy CSV to public/data/stores.json + public/data/stats.json.
 * Run: npx tsx scripts/convert-csv.ts
 */
import { parse } from "csv-parse/sync";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const csvPath =
  process.env.UPPY_MAP_SOURCE_CSV ||
  resolve(__dirname, "../../all_stores_unified_UPPY_CURATED_V5.csv");
const outPath = resolve(__dirname, "../public/data/stores.json");
const statsPath = resolve(__dirname, "../public/data/stats.json");

const raw = readFileSync(csvPath, "utf-8").replace(/^\uFEFF/, "");
const records: Record<string, string>[] = parse(raw, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
});

interface StoreOut {
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

const stores: StoreOut[] = [];
const cities = new Set<string>();
const countries = new Set<string>();
const continents = new Set<string>();

for (const row of records) {
  const lat = parseFloat(row.lat || "");
  const lng = parseFloat(row.lng || "");
  if (!isFinite(lat) || !isFinite(lng)) continue;
  if (!row.name?.trim()) continue;

  const city = row.city?.trim() || "";
  const country = row.country?.trim() || "";
  const continent = row.continent?.trim() || "";

  stores.push({
    id: parseInt(row.id || "", 10) || 0,
    n: row.name?.trim() || "",
    d: row.description?.trim() || "",
    c: row.category?.trim() || "clothing",
    ci: city,
    co: country,
    cn: continent,
    la: Math.round(lat * 1e6) / 1e6,
    ln: Math.round(lng * 1e6) / 1e6,
    r: Math.round((parseFloat(row.rating || "0") || 0) * 10) / 10,
    w: row.website?.trim() || "",
    ig: row.instagram?.trim() || "",
    t: row.tags?.trim() || "",
    imgs: row.image_url?.trim() ? [row.image_url.trim()] : [],
  });

  if (city) cities.add(city);
  if (country) countries.add(country);
  if (continent) continents.add(continent);
}

writeFileSync(outPath, JSON.stringify(stores));
writeFileSync(
  statsPath,
  JSON.stringify(
    {
      stores: stores.length,
      cities: cities.size,
      countries: countries.size,
      continents: continents.size,
    },
    null,
    2
  )
);

const sizeKB = Math.round(JSON.stringify(stores).length / 1024);
console.log(`Converted ${stores.length} stores -> ${outPath} (${sizeKB} KB)`);
console.log(
  `Stats -> stores=${stores.length}, cities=${cities.size}, countries=${countries.size}, continents=${continents.size}`
);
