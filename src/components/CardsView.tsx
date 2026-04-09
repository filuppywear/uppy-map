"use client";

import { useMemo } from "react";
import type { Store } from "@/lib/types";
import { getTileImage } from "@/lib/geo";

type NavLevel = "continent" | "country" | "city" | "stores";

interface NavEntry {
  level: NavLevel;
  value: string;
}

interface Props {
  stores: Store[];
  navStack: NavEntry[];
  onNavigate: (level: NavLevel, value: string) => void;
  onStoreSelect: (store: Store) => void;
}

function getFallbackStoreVisual(store: Store) {
  const palette: Record<string, string> = {
    clothing: "linear-gradient(135deg, #d9c5b5, #f7efe6)",
    flea_market: "linear-gradient(135deg, #d5bca8, #efe2d6)",
    "design-objects": "linear-gradient(135deg, #d4d8dd, #f7f4ef)",
    books: "linear-gradient(135deg, #cab9a8, #f7efe5)",
    accessories: "linear-gradient(135deg, #d8c0b4, #fff8f2)",
    art: "linear-gradient(135deg, #ddd0c8, #f8f3ee)",
    shoes: "linear-gradient(135deg, #ceb8ad, #f7ede4)",
    music: "linear-gradient(135deg, #cec7cf, #f6f0f6)",
    film: "linear-gradient(135deg, #cfc4be, #f4ede8)",
    retrogaming: "linear-gradient(135deg, #c9d7d0, #f4f8f5)",
    "action-figures": "linear-gradient(135deg, #d7c9d9, #f7eff7)",
  };

  return palette[store.category] || "linear-gradient(135deg, #d8cfc6, #f8f2ea)";
}

export default function CardsView({ stores, navStack, onNavigate, onStoreSelect }: Props) {
  const currentLevel: NavLevel =
    navStack.length === 0 ? "continent" : navStack.length === 1 ? "country" : navStack.length === 2 ? "city" : "stores";

  const filteredStores = useMemo(() => {
    let result = stores;
    for (const entry of navStack) {
      if (entry.level === "continent") result = result.filter((store) => store.continent === entry.value);
      if (entry.level === "country") result = result.filter((store) => store.country === entry.value);
      if (entry.level === "city") result = result.filter((store) => store.city === entry.value);
    }
    return result;
  }, [stores, navStack]);

  const items = useMemo(() => {
    const field =
      currentLevel === "continent"
        ? "continent"
        : currentLevel === "country"
          ? "country"
          : currentLevel === "city"
            ? "city"
            : null;

    if (!field) return [];

    const source = currentLevel === "continent" ? stores : filteredStores;
    const counts = new Map<string, number>();
    for (const store of source) {
      const value = store[field as keyof Store] as string;
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((left, right) => (currentLevel === "city" ? right[1] - left[1] : left[0].localeCompare(right[0])))
      .map(([name, count]) => ({ name, count }));
  }, [currentLevel, stores, filteredStores]);

  const currentFilter = navStack[navStack.length - 1]?.value;
  const title = currentLevel === "continent" ? "Browse by region" : currentFilter;
  const subtitle =
    currentLevel === "continent"
      ? `${stores.length.toLocaleString()} stores in the unlocked dataset`
      : currentLevel === "stores"
        ? `${filteredStores.length.toLocaleString()} stores`
        : `${items.length.toLocaleString()} ${currentLevel === "country" ? "countries" : "cities"}`;

  return (
    <div className="flex flex-col" style={{ background: "#fff", height: "100%" }}>
      <div className="px-4 md:px-8 pt-14 pb-4" style={{ background: "#fff" }}>
        <h2
          className="text-[2rem] md:text-[2.4rem] font-bold tracking-tight"
          style={{ color: "#302020", fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        <p className="text-sm mt-2" style={{ color: "#5f544f" }}>
          {subtitle}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-6">

      {currentLevel !== "stores" && (
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item, index) => (
            <button
              key={item.name}
              type="button"
              onClick={() => onNavigate(currentLevel, item.name)}
              className="group relative overflow-hidden text-left"
              style={{
                aspectRatio: "3 / 4",
                border: "1px solid rgba(36,27,25,0.1)",
                boxShadow: "0 18px 40px rgba(36,27,25,0.08)",
                background: "#d8cfc6",
              }}
            >
              <img
                src={getTileImage(item.name, index)}
                alt={item.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-x-4 bottom-4 z-10">
                <h3 className="text-base sm:text-lg font-bold leading-tight text-white">{item.name}</h3>
              </div>
            </button>
          ))}
        </div>
      )}

      {currentLevel === "stores" && (
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredStores.map((store) => (
            <button
              key={store.id}
              type="button"
              onClick={() => onStoreSelect(store)}
              className="group relative overflow-hidden text-left"
              style={{
                aspectRatio: "3 / 4",
                border: "1px solid rgba(36,27,25,0.1)",
                boxShadow: "0 18px 40px rgba(36,27,25,0.08)",
                background: "#d8cfc6",
              }}
            >
              {store.images[0] ? (
                <img
                  src={store.images[0]}
                  alt={store.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0" style={{ background: getFallbackStoreVisual(store) }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-x-4 bottom-4 z-10">
                <h3 className="text-base sm:text-lg font-bold leading-tight text-white">{store.name}</h3>
              </div>
            </button>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
