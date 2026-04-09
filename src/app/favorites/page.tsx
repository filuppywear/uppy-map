"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserFavoriteIds } from "@/actions/favorites";
import type { StoreRaw, Store } from "@/lib/types";
import { expandStore, formatCategoryLabel } from "@/lib/types";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";

export default function FavoritesPage() {
  const { isLoggedIn, loading } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    fetch("/data/stores.json")
      .then((r) => r.json())
      .then((d: StoreRaw[]) => {
        setAllStores(d.map(expandStore));
        setDataReady(true);
      })
      .catch(() => setDataReady(true));
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    void getUserFavoriteIds().then(setFavoriteIds);
  }, [isLoggedIn]);

  const favoriteStores = allStores.filter((s) => favoriteIds.includes(s.id));

  if (loading || !dataReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#302020" }}>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6" style={{ background: "#302020" }}>
        <Image src="/branding/logo-white.svg" alt="Uppy" width={80} height={28} style={{ filter: "brightness(10)" }} />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Sign in to see your favorites.</p>
        <Link href="/" className="text-sm font-bold uppercase tracking-wider px-6 py-3" style={{ background: "#fff", color: "#302020", textDecoration: "none" }}>
          Go to map
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#302020" }}>
      <PageHeader activePage="map" />
      <div className="max-w-5xl mx-auto p-6 pt-8">
        <h1 className="font-bold uppercase mb-2" style={{ fontSize: "16px", letterSpacing: "0.08em", color: "#fff" }}>
          Favorites
        </h1>
        <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
          {favoriteStores.length} saved store{favoriteStores.length !== 1 ? "s" : ""}
        </p>

        {favoriteStores.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="mx-auto mb-4" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No favorites yet. Tap the heart on any store to save it.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favoriteStores.map((store) => (
              <Link
                key={store.id}
                href={`/?store=${store.id}`}
                className="group relative overflow-hidden text-left block"
                style={{
                  aspectRatio: "4 / 5",
                  border: "1px solid rgba(36,27,25,0.1)",
                  boxShadow: "0 18px 40px rgba(36,27,25,0.08)",
                  background: "#d8cfc6",
                  textDecoration: "none",
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
                  <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #d8cfc6, #f8f2ea)" }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/22 to-transparent" />
                <div className="absolute inset-x-4 top-4 z-10 flex justify-between">
                  <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ background: "rgba(255,250,244,0.9)", color: "#302020" }}>
                    {formatCategoryLabel(store.category)}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <div className="absolute inset-x-4 bottom-4 z-10 flex flex-col gap-1">
                  <h3 className="text-lg font-bold leading-tight text-white">{store.name}</h3>
                  <p className="text-xs text-white/60">{[store.city, store.country].filter(Boolean).join(", ")}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
