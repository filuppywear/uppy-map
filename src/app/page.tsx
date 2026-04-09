import { Suspense } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import MapSection from "@/components/MapSection";
import { DEFAULT_STATS, type DatasetStats } from "@/lib/types";

async function getInitialStats(): Promise<DatasetStats> {
  try {
    const statsPath = path.join(process.cwd(), "public", "data", "stats.json");
    const raw = await readFile(statsPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<DatasetStats>;

    if (
      typeof parsed.stores === "number" &&
      typeof parsed.cities === "number" &&
      typeof parsed.countries === "number" &&
      typeof parsed.continents === "number"
    ) {
      return parsed as DatasetStats;
    }
  } catch {
    // Fall back to the last curated snapshot baked into the repo.
  }

  return DEFAULT_STATS;
}

export default async function Home() {
  const initialStats = await getInitialStats();

  return (
    <main>
      <Suspense fallback={null}>
        <MapSection initialStats={initialStats} />
      </Suspense>
    </main>
  );
}
