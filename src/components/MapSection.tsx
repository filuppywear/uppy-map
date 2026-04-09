"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { StoreRaw, Store, DatasetStats } from "@/lib/types";
import { expandStore, CATEGORIES, DEFAULT_STATS, hasStoreCoordinates } from "@/lib/types";
import { CONTINENT_CENTERS } from "@/lib/geo";
import CardsView from "./CardsView";
import WaitlistPopup from "./WaitlistPopup";
import StoreDetailModal from "./StoreDetailModal";
import Image from "next/image";
import { hasWaitlistAccess } from "@/lib/waitlist";
import { useAuth } from "@/hooks/useAuth";
import { getUserFavoriteIds, toggleStoreFavorite } from "@/actions/favorites";
import ProposalForm from "./ProposalForm";
import MobileBottomBar, { type BottomTab } from "./MobileBottomBar";
import LeaderboardView from "./LeaderboardView";
import ProfileView from "./ProfileView";
import ProfileSetup from "./ProfileSetup";
import { getProfile } from "@/actions/profile";
import OnboardingWall from "./OnboardingWall";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

type NavLevel = "continent" | "country" | "city" | "stores";
interface NavEntry { level: NavLevel; value: string }
interface SearchResult {
  type: "store" | "city" | "country" | "continent";
  label: string;
  sublabel: string;
  store?: Store;
  geoValue?: string;
  geoLevel?: NavLevel;
}
type ViewMode = "map" | "cards";
type Phase = "loading" | "app";

/* ═══════════════════════════════════════════════════
   LOADING SCREEN
   ═══════════════════════════════════════════════════ */
function LoadingScreen({ onComplete, stats }: { onComplete: () => void; stats: DatasetStats }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setFading(true), 850);
    const completeTimer = window.setTimeout(onComplete, 1450);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-700 ${fading ? "opacity-0 scale-105" : "opacity-100"}`} style={{ background: "#302020" }}>
      <Image src="/branding/logo-white.svg" alt="" width={120} height={40} className="mb-12" style={{ filter: "brightness(10)" }} priority />
      <div className="text-7xl sm:text-8xl md:text-9xl font-black tabular-nums" style={{ fontFamily: "'Montserrat', var(--font-display)", color: "#FFFFFF", letterSpacing: "-0.03em" }}>
        {stats.stores.toLocaleString()}
      </div>
      <div className="text-sm font-black uppercase tracking-[0.4em] mt-4 mb-14" style={{ fontFamily: "'Montserrat', var(--font-display)", color: "#FFFFFF", opacity: 0.5 }}>
        secondhand stores
      </div>
      <div className="flex gap-12">
        {[{ v: stats.cities, l: "cities" }, { v: stats.countries, l: "countries" }, { v: stats.continents, l: "continents" }].map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-2xl font-black tabular-nums" style={{ color: "#FFFFFF", fontFamily: "'Montserrat', var(--font-display)" }}>{s.v}</div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: "#FFFFFF", opacity: 0.3 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-8 text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "#FFFFFF", opacity: 0.2 }}>
        The world&apos;s thrift map
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   GEO PILLS — mobile auto-scroll hint
   ═══════════════════════════════════════════════════ */
function GeoPills({ items, onSelect, label, onLabelClick }: { items: { name: string; count: number }[]; onSelect: (name: string) => void; label: string; onLabelClick?: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchedRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || items.length < 4) return;
    const t = setTimeout(() => {
      if (!touchedRef.current) {
        el.scrollTo({ left: el.scrollWidth * 0.4, behavior: "smooth" });
        setTimeout(() => el.scrollTo({ left: 0, behavior: "smooth" }), 700);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [items]);

  return (
    <div className="flex items-center gap-0 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <button
        onClick={onLabelClick}
        className="shrink-0 px-3 h-9 text-[11px] font-bold uppercase tracking-[0.08em]"
        style={{ color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: onLabelClick ? "pointer" : "default", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {label}
      </button>
      <div
        ref={scrollRef}
        onTouchStart={() => { touchedRef.current = true; }}
        className="flex items-center gap-4 overflow-x-auto scrollbar-hide px-3 h-9"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item) => (
          <button
            key={item.name}
            onClick={() => onSelect(item.name)}
            className="shrink-0 text-[12px] font-medium whitespace-nowrap"
            style={{ color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MINI FOOTER
   ═══════════════════════════════════════════════════ */
export function MiniFooter() {
  return (
    <footer className="px-4 py-3 text-center text-[10px] leading-relaxed" style={{ background: "#302020", color: "#FFFFFF", borderTop: "1px solid rgba(255,255,255,0.06)", opacity: 0.4 }}>
      Uppy srl &middot; VAT 04914300167 &middot; 291 Bolagnos Street, Caravaggio 24043
    </footer>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════ */
export default function MapSection({ initialStats = DEFAULT_STATS }: { initialStats?: DatasetStats }) {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [dataReady, setDataReady] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [phase, setPhase] = useState<Phase>("loading");
  const [view, setView] = useState<ViewMode>("map");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [catOpen, setCatOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [minRating, setMinRating] = useState(0);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search stores...");
  const [marketNotice, setMarketNotice] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [showNewStoreForm, setShowNewStoreForm] = useState(false);
  const [activeTab, setActiveTab] = useState<BottomTab>("map");
  const onboardingChecked = useRef(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const storeIntentAppliedRef = useRef<number | null>(null);
  const marketIntentHandledRef = useRef(false);

  const [mapLocation, setMapLocation] = useState<{ continent?: string; country?: string; city?: string }>({});
  const mapFlyTo = useRef<((lng: number, lat: number, zoom: number) => void) | null>(null);
  const viewportLockUntil = useRef(0);
  const storeQuery = searchParams.get("store");
  const marketQuery = searchParams.get("market");

  const replaceQuery = useCallback((mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const closeAll = useCallback(() => { setCatOpen(false); setRatingOpen(false); setSearchOpen(false); setMobileMenuOpen(false); }, []);

  // Typewriter placeholder
  useEffect(() => {
    if (phase !== "app") return;
    const phrases = ["Search stores...", "Try \"Tokyo vintage\"", "Try \"Berlin thrift\"", "Try \"Brooklyn flea\""];
    let phraseIdx = 0, charIdx = 0, deleting = false;
    let t: ReturnType<typeof setTimeout>;
    function tick() {
      const phrase = phrases[phraseIdx];
      if (!deleting) { charIdx++; setSearchPlaceholder(phrase.slice(0, charIdx)); if (charIdx >= phrase.length) { t = setTimeout(() => { deleting = true; tick(); }, 2000); return; } t = setTimeout(tick, 60); }
      else { charIdx--; setSearchPlaceholder(phrase.slice(0, charIdx)); if (charIdx <= 0) { deleting = false; phraseIdx = (phraseIdx + 1) % phrases.length; t = setTimeout(tick, 300); return; } t = setTimeout(tick, 30); }
    }
    t = setTimeout(tick, 1000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    fetch("/data/stores.json").then(r => r.json()).then((d: StoreRaw[]) => { setAllStores(d.map(expandStore)); setDataReady(true); }).catch((err) => { console.error("Failed to load stores:", err); setDataReady(true); });
  }, []);

  useEffect(() => {
    if (!loadingComplete || !dataReady || phase !== "loading") return;
    // Always go to app — onboarding wall handles auth if needed
    setPhase("app");
  }, [dataReady, loadingComplete, phase]);

  // Show onboarding wall ONCE on first app load — skip if already logged in
  useEffect(() => {
    if (phase !== "app" || onboardingChecked.current || isLoggedIn) return;
    onboardingChecked.current = true;
    if (localStorage.getItem("uppy_map_onboarding_complete") || hasWaitlistAccess()) return;
    setShowOnboarding(true);
  }, [phase, isLoggedIn]);

  // Check if logged-in user needs profile setup (no full_name)
  useEffect(() => {
    if (!isLoggedIn || showOnboarding) return;
    if (localStorage.getItem("uppy_map_profile_setup_done")) return;
    getProfile().then((p) => {
      if (p && !p.full_name) setShowProfileSetup(true);
      if (p?.full_name) localStorage.setItem("uppy_map_profile_setup_done", "true");
    }).catch(() => {});
  }, [isLoggedIn, showOnboarding]);

  const handleLoadingComplete = useCallback(() => {
    setLoadingComplete(true);
  }, []);

  // Load favorites when logged in
  useEffect(() => {
    if (!isLoggedIn) { setSavedIds([]); return; }
    void getUserFavoriteIds().then(setSavedIds);
  }, [isLoggedIn]);

  useEffect(() => {
    if (phase !== "app" || marketQuery !== "1" || marketIntentHandledRef.current) return;
    marketIntentHandledRef.current = true;
    if (isLoggedIn) setMarketNotice(true);
    else setShowAuthPopup(true);
    replaceQuery((params) => params.delete("market"));
  }, [isLoggedIn, marketQuery, phase, replaceQuery]);

  const handleToggleSave = useCallback(async (storeId: number) => {
    if (!isLoggedIn) { setShowAuthPopup(true); return; }
    setSavedIds(prev => prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]);
    const result = await toggleStoreFavorite(storeId);
    if ("error" in result) {
      setSavedIds(prev => prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]);
    }
  }, [isLoggedIn]);

  const filteredStores = useMemo(() => allStores.filter(s => {
    if (activeCategories.size > 0 && !activeCategories.has(s.category)) return false;
    if (minRating > 0 && s.rating < minRating) return false;
    return true;
  }), [allStores, activeCategories, minRating]);

  // Geo nav derived from map viewport
  const effectiveNav = useMemo((): NavEntry[] => {
    const result: NavEntry[] = [];
    if (mapLocation.continent) result.push({ level: "continent", value: mapLocation.continent });
    if (mapLocation.country) result.push({ level: "country", value: mapLocation.country });
    if (mapLocation.city) result.push({ level: "city", value: mapLocation.city });
    return result;
  }, [mapLocation]);

  const currentGeoLevel: NavLevel = effectiveNav.length === 0 ? "continent" : effectiveNav.length === 1 ? "country" : effectiveNav.length === 2 ? "city" : "stores";

  const geoItems = useMemo(() => {
    const field = currentGeoLevel === "continent" ? "continent" : currentGeoLevel === "country" ? "country" : currentGeoLevel === "city" ? "city" : null;
    if (!field) return [];
    const counts = new Map<string, number>();
    for (const s of filteredStores) {
      let include = true;
      for (const e of effectiveNav) { if (s[e.level as keyof Store] !== e.value) { include = false; break; } }
      if (!include) continue;
      const val = s[field as keyof Store] as string;
      if (val) counts.set(val, (counts.get(val) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([name, count]) => ({ name, count }));
  }, [currentGeoLevel, filteredStores, effectiveNav]);

  const handleGeoSelect = useCallback((level: NavLevel, value: string) => {
    viewportLockUntil.current = Date.now() + 5000;
    setMapLocation(prev => {
      if (level === "continent") return { continent: value };
      if (level === "country") return { continent: prev.continent, country: value };
      return { ...prev, city: value };
    });
    if (level === "continent") {
      const c = CONTINENT_CENTERS[value];
      if (c) mapFlyTo.current?.(c.lng, c.lat, c.zoom);
    } else {
      const zoom = level === "country" ? 5.5 : 11;
      const field = level as keyof Store;
      const matching = filteredStores.filter(s => s[field] === value && hasStoreCoordinates(s));
      if (matching.length) mapFlyTo.current?.(matching.reduce((s, x) => s + x.lng, 0) / matching.length, matching.reduce((s, x) => s + x.lat, 0) / matching.length, zoom);
    }
  }, [filteredStores]);

  const handleGeoNavigateTo = useCallback((index: number) => {
    viewportLockUntil.current = Date.now() + 5000;
    if (index === 0) {
      setMapLocation({});
      const mob = window.innerWidth < 768;
      mapFlyTo.current?.(10, 20, mob ? 0.8 : 1.8);
    } else {
      setMapLocation(prev => {
        if (index === 1) return { continent: prev.continent };
        if (index === 2) return { continent: prev.continent, country: prev.country };
        return prev;
      });
      const target = effectiveNav[index - 1];
      if (target?.level === "continent") { const c = CONTINENT_CENTERS[target.value]; if (c) mapFlyTo.current?.(c.lng, c.lat, c.zoom); }
      else if (target?.level === "country" || target?.level === "city") {
        const zoom = target.level === "country" ? 5.5 : 11;
        const field = target.level as keyof Store;
        const matching = filteredStores.filter(s => s[field] === target.value && hasStoreCoordinates(s));
        if (matching.length) mapFlyTo.current?.(matching.reduce((s, x) => s + x.lng, 0) / matching.length, matching.reduce((s, x) => s + x.lat, 0) / matching.length, zoom);
      }
    }
  }, [effectiveNav, filteredStores]);

  const handleGoBack = useCallback(() => {
    viewportLockUntil.current = Date.now() + 5000;
    const navLen = effectiveNav.length;

    // Go up one level
    if (navLen <= 1) {
      setMapLocation({});
      const mob = window.innerWidth < 768;
      mapFlyTo.current?.(10, 20, mob ? 0.8 : 1.8);
    } else if (navLen === 2) {
      setMapLocation({ continent: effectiveNav[0].value });
      const c = CONTINENT_CENTERS[effectiveNav[0].value];
      if (c) mapFlyTo.current?.(c.lng, c.lat, c.zoom);
    } else {
      setMapLocation({ continent: effectiveNav[0].value, country: effectiveNav[1].value });
      const matching = allStores.filter(s => s.country === effectiveNav[1].value && hasStoreCoordinates(s));
      if (matching.length) mapFlyTo.current?.(matching.reduce((s, x) => s + x.lng, 0) / matching.length, matching.reduce((s, x) => s + x.lat, 0) / matching.length, 5.5);
    }
  }, [effectiveNav, allStores]);

  const handleViewportChange = useCallback((center: [number, number], zoom: number) => {
    if (Date.now() < viewportLockUntil.current) return;
    if (zoom < 2) { setMapLocation({}); return; }
    const [lng, lat] = center;
    let closest: Store | null = null, minDist = Infinity;
    for (const s of allStores) { if (!hasStoreCoordinates(s)) continue; const d = (s.lng - lng) ** 2 + (s.lat - lat) ** 2; if (d < minDist) { minDist = d; closest = s; } }
    if (!closest) return;
    if (zoom >= 10) setMapLocation({ continent: closest.continent, country: closest.country, city: closest.city });
    else if (zoom >= 5) setMapLocation({ continent: closest.continent, country: closest.country });
    else if (zoom >= 2.5) setMapLocation({ continent: closest.continent });
    else setMapLocation({});
  }, [allStores]);

  const toggleCategory = useCallback((cat: string) => { setActiveCategories(prev => { const n = new Set(prev); if (n.has(cat)) n.delete(cat); else n.add(cat); return n; }); }, []);

  const focusStore = useCallback((store: Store) => {
    if (store.continent || store.country || store.city) {
      viewportLockUntil.current = Date.now() + 5000;
      setMapLocation({
        continent: store.continent || undefined,
        country: store.country || undefined,
        city: store.city || undefined,
      });
    }
    setView("map");
    if (hasStoreCoordinates(store)) {
      mapFlyTo.current?.(store.lng, store.lat, 14);
    }
    setSelectedStore(store);
  }, []);

  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Search continents
    const continents = new Set(allStores.map(s => s.continent).filter(Boolean));
    for (const c of continents) {
      if (c.toLowerCase().includes(q)) results.push({ type: "continent", label: c, sublabel: "Region", geoValue: c, geoLevel: "continent" });
    }

    // Search countries
    const countries = new Map<string, string>();
    for (const s of allStores) { if (s.country && !countries.has(s.country)) countries.set(s.country, s.continent); }
    for (const [co, cont] of countries) {
      if (co.toLowerCase().includes(q)) results.push({ type: "country", label: co, sublabel: cont, geoValue: co, geoLevel: "country" });
    }

    // Search cities
    const cities = new Map<string, string>();
    for (const s of allStores) { if (s.city && !cities.has(s.city)) cities.set(s.city, s.country); }
    for (const [ci, co] of cities) {
      if (ci.toLowerCase().includes(q)) results.push({ type: "city", label: ci, sublabel: co, geoValue: ci, geoLevel: "city" });
    }

    // Search stores by name, category, tags
    for (const s of allStores) {
      const haystack = [s.name, s.category, s.tags].filter(Boolean).join(" ").toLowerCase();
      if (haystack.includes(q)) results.push({ type: "store", label: s.name, sublabel: [s.city, s.country].filter(Boolean).join(", "), store: s });
    }

    return results.slice(0, 10);
  }, [allStores, searchQuery]);

  const handleSearchSelect = useCallback((result: SearchResult) => {
    setSearchQuery("");
    setSearchOpen(false);
    setView("map");
    viewportLockUntil.current = Date.now() + 5000;

    if (result.type === "store" && result.store) {
      focusStore(result.store);
    } else if (result.type === "continent" && result.geoValue) {
      setMapLocation({ continent: result.geoValue! });
      const c = CONTINENT_CENTERS[result.geoValue!];
      if (c) mapFlyTo.current?.(c.lng, c.lat, c.zoom);
    } else if (result.type === "country" && result.geoValue) {
      // Find the continent for this country
      const sample = allStores.find(s => s.country === result.geoValue);
      setMapLocation({ continent: sample?.continent || undefined, country: result.geoValue! });
      const matching = allStores.filter(s => s.country === result.geoValue && hasStoreCoordinates(s));
      if (matching.length) mapFlyTo.current?.(matching.reduce((a, s) => a + s.lng, 0) / matching.length, matching.reduce((a, s) => a + s.lat, 0) / matching.length, 5.5);
    } else if (result.type === "city" && result.geoValue) {
      // Find continent + country for this city
      const sample = allStores.find(s => s.city === result.geoValue);
      setMapLocation({ continent: sample?.continent || undefined, country: sample?.country || undefined, city: result.geoValue! });
      const matching = allStores.filter(s => s.city === result.geoValue && hasStoreCoordinates(s));
      if (matching.length) mapFlyTo.current?.(matching.reduce((a, s) => a + s.lng, 0) / matching.length, matching.reduce((a, s) => a + s.lat, 0) / matching.length, 11);
    }
  }, [allStores, focusStore]);
  const handleStoreSelect = useCallback((store: Store) => {
    focusStore(store);
  }, [focusStore]);

  const handleMapReady = useCallback((fn: (lng: number, lat: number, zoom: number) => void) => { mapFlyTo.current = fn; }, []);
  const handleZoomOutToWorld = useCallback(() => handleGeoNavigateTo(0), [handleGeoNavigateTo]);
  const handleCloseStore = useCallback(() => { setSelectedStore(null); }, []);

  useEffect(() => {
    if (phase !== "app" || !dataReady) return;
    if (!storeQuery) {
      storeIntentAppliedRef.current = null;
      return;
    }

    const storeId = Number(storeQuery);
    if (!Number.isFinite(storeId)) return;
    if (selectedStore?.id === storeId || storeIntentAppliedRef.current === storeId) return;

    const store = allStores.find((entry) => entry.id === storeId);
    if (!store) return;

    storeIntentAppliedRef.current = storeId;
    focusStore(store);
  }, [allStores, dataReady, focusStore, phase, selectedStore?.id, storeQuery]);

  useEffect(() => {
    if (phase !== "app") return;
    const currentStoreId = searchParams.get("store");
    const nextStoreId = selectedStore ? String(selectedStore.id) : null;
    if (currentStoreId === nextStoreId) return;
    replaceQuery((params) => {
      if (nextStoreId) params.set("store", nextStoreId);
      else params.delete("store");
    });
  }, [phase, replaceQuery, searchParams, selectedStore]);

  return (
    <>
      {phase === "loading" && <LoadingScreen onComplete={handleLoadingComplete} stats={initialStats} />}

      <div className={`h-screen flex flex-col pb-[4.5rem] lg:pb-0 transition-all duration-700 ${phase === "loading" ? "opacity-0" : "opacity-100"}`}>

        {/* ══ HEADER ══ */}
        <div className="sticky top-0 z-30" style={{ background: "#302020" }}>

          {/* ══ DESKTOP HEADER — Row 1: Nav / Logo / Icons ══ */}
          <div className="hidden lg:flex items-center h-12 px-4 md:px-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            {/* Left: nav links */}
            <nav className="flex items-center gap-5">
              <button onClick={() => isLoggedIn ? setMarketNotice(true) : setShowAuthPopup(true)} className="header-btn uppercase flex items-center gap-1.5" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.7)", background: "none", border: "none", cursor: "pointer" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                Market
              </button>
              <button onClick={() => { handleGeoNavigateTo(0); setView("map"); closeAll(); }} className="uppercase" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", fontFamily: "Inter, sans-serif", color: "#fff", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "4px", textDecorationThickness: "1px" }}>Map</button>
              <Link href="/leaderboard" className="header-btn uppercase" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Leaderboard</Link>
            </nav>

            {/* Center: logo */}
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2">
              <button onClick={() => { handleGeoNavigateTo(0); setView("map"); closeAll(); }} className="pointer-events-auto" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <Image src="/branding/logo-white.svg" alt="Uppy" width={94} height={28} className="h-7 w-auto object-contain" style={{ filter: "brightness(10)" }} />
              </button>
            </div>

            <div className="flex-1" />

            {/* Right: icon buttons */}
            <div className="flex items-center gap-1.5">
              {isLoggedIn ? (
                <Link href="/favorites" className="header-btn p-2 text-white" title="Favorites">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                </Link>
              ) : (
                <button type="button" onClick={() => setShowAuthPopup(true)} className="header-btn p-2 text-white" style={{ background: "none", border: "none", cursor: "pointer" }} title="Favorites">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                </button>
              )}
              <button onClick={() => { setSearchOpen(!searchOpen); setCatOpen(false); setRatingOpen(false); }} className="header-btn p-2 text-white" style={{ cursor: "pointer", background: "none", border: "none" }} title="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
              {isLoggedIn ? (
                <Link href="/profile" className="header-btn p-2 text-white" title="Profile">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </Link>
              ) : (
                <button type="button" onClick={() => setShowAuthPopup(true)} className="header-btn p-2 text-white" style={{ background: "none", border: "none", cursor: "pointer" }} title="Sign in">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </button>
              )}
            </div>
          </div>

          {/* ══ DESKTOP HEADER — Row 2: Crumbs (left) + Cities (center) + Filter (right) ══ */}
          <div className="hidden lg:flex items-center px-4 md:px-8 h-10 relative" style={{ background: "#302020", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Crumbs — left */}
            <nav className="flex items-center gap-2 shrink-0" style={{ lineHeight: 1 }}>
              <button onClick={() => handleGeoNavigateTo(0)} className="header-btn" style={{ fontSize: "11px", letterSpacing: "0.05em", fontFamily: "Inter, sans-serif", fontWeight: effectiveNav.length === 0 ? 700 : 500, textTransform: "uppercase" as const, color: effectiveNav.length === 0 ? "#fff" : "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>World</button>
              {effectiveNav.map((entry, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.15)" }}>/</span>
                  <button onClick={() => handleGeoNavigateTo(i + 1)} className="header-btn whitespace-nowrap" style={{ fontSize: "11px", letterSpacing: "0.05em", fontFamily: "Inter, sans-serif", fontWeight: i === effectiveNav.length - 1 ? 700 : 500, textTransform: "uppercase" as const, color: i === effectiveNav.length - 1 ? "#fff" : "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{entry.value}</button>
                </span>
              ))}
            </nav>

            {/* Cities — center */}
            {geoItems.length > 0 && (
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 overflow-x-auto scrollbar-hide" style={{ lineHeight: 1 }}>
                {geoItems.slice(0, 8).map(item => (
                  <button key={item.name} onClick={() => { handleGeoSelect(currentGeoLevel === "stores" ? "city" : currentGeoLevel, item.name); closeAll(); }} className="header-btn shrink-0 whitespace-nowrap" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.05em", fontFamily: "Inter, sans-serif", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)", border: "none", cursor: "pointer", background: "none", padding: 0 }}>{item.name}</button>
                ))}
              </div>
            )}
            <div className="absolute right-4 md:right-8 flex items-center shrink-0">
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setCatOpen(!catOpen); }} className="header-btn w-10 h-10 flex items-center justify-center" style={{ color: (activeCategories.size > 0 || minRating > 0) ? "#fff" : "rgba(255,255,255,0.4)", cursor: "pointer", background: "none", border: "none" }} title="Filters">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="4" y1="6" x2="20" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="8" y1="18" x2="16" y2="18" /></svg>
                  {(activeCategories.size > 0 || minRating > 0) && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5" style={{ background: "#fff" }} />}
                </button>
                {catOpen && (
                  <div className="absolute top-full right-0 mt-2 p-3 min-w-[200px]" style={{ zIndex: 45, background: "#352A2A", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Categories</div>
                    {CATEGORIES.map(cat => (
                      <button key={cat.key} onClick={() => toggleCategory(cat.key)} className="header-btn w-full text-left px-2 py-1.5 text-xs font-bold flex items-center gap-2" style={{ color: "#fff", background: "none", border: "none", cursor: "pointer" }}>
                        <span className="w-3.5 h-3.5 flex items-center justify-center" style={{ border: "2px solid rgba(255,255,255,0.4)" }}>{activeCategories.has(cat.key) && <span style={{ width: 8, height: 8, background: "#fff", display: "block" }} />}</span>
                        {cat.label}
                      </button>
                    ))}
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] mt-3 mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Min rating</div>
                    <div className="flex gap-1">
                      {[0, 3, 3.5, 4, 4.5].map(r => (
                        <button key={r} onClick={() => setMinRating(r)} className="px-2 py-1 text-[11px] font-bold" style={{ color: minRating === r ? "#302020" : "rgba(255,255,255,0.6)", background: minRating === r ? "#fff" : "transparent", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer" }}>{r === 0 ? "All" : `${r}+`}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold ml-2" style={{ color: "rgba(255,255,255,0.4)" }}>{filteredStores.length.toLocaleString()}</span>
            </div>
          </div>

          {/* ══ MOBILE HEADER ══ */}
          <div className="lg:hidden">
            <div className="relative flex items-center justify-center px-3 h-14">
              <button onClick={() => { handleGeoNavigateTo(0); setView("map"); closeAll(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Image src="/branding/logo-white.svg" alt="Uppy" width={44} height={14} style={{ filter: "brightness(10)" }} /></button>
              <div className="absolute right-3 flex items-center">
                {isLoggedIn ? (
                  <Link href="/favorites" className="header-btn p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                  </Link>
                ) : (
                  <button type="button" onClick={() => setShowAuthPopup(true)} className="header-btn p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-white" style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                  </button>
                )}
                <button type="button" onClick={() => { setSearchOpen(!searchOpen); setCatOpen(false); setRatingOpen(false); setMobileMenuOpen(false); }} className="header-btn p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-white" style={{ cursor: "pointer", background: "none", border: "none" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </button>
                {isLoggedIn ? (
                  <Link href="/profile" className="header-btn p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </Link>
                ) : (
                  <button type="button" onClick={() => setShowAuthPopup(true)} className="header-btn p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-white" style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </button>
                )}
              </div>
            </div>
            {geoItems.length > 0 && (
              <GeoPills
                items={geoItems}
                onSelect={(name) => { handleGeoSelect(currentGeoLevel === "stores" ? "city" : currentGeoLevel, name); closeAll(); }}
                label={effectiveNav.length > 0 ? effectiveNav[effectiveNav.length - 1].value : "World"}
                onLabelClick={effectiveNav.length > 0 ? handleGoBack : undefined}
              />
            )}
          </div>

          {/* Map/Cards toggle removed from header — now floating */}

          {/* Search slide-down */}
          {searchOpen && (
            <div className="px-3 md:px-5 pb-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={searchPlaceholder} autoFocus className="w-full pl-9 pr-4 py-2.5 text-sm font-medium outline-none" style={{ background: "transparent", color: "#fff", fontSize: "16px", border: "none", borderBottom: "1px solid rgba(255,255,255,0.2)" }} />
              </div>
              {searchQuery.length >= 2 && (
                <div style={{ background: "#352A2A", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  {searchResults.length === 0 ? (
                    <div className="px-3 py-4 text-center" style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>No results for &ldquo;{searchQuery}&rdquo;</div>
                  ) : searchResults.map((result, idx) => (
                    <button key={`${result.type}-${result.label}-${idx}`} onClick={() => handleSearchSelect(result)} className="header-btn w-full text-left px-3 py-2.5 flex items-center gap-2 min-h-[44px]" style={{ borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.06)" : "none", color: "#fff", background: "none", cursor: "pointer", border: "none" }}>
                      <span className="shrink-0 uppercase font-bold" style={{ fontSize: "8px", letterSpacing: "0.1em", color: result.type === "store" ? "rgba(255,255,255,0.25)" : "#A58277", width: "42px" }}>{result.type === "store" ? "store" : result.type}</span>
                      <span className="truncate font-semibold" style={{ fontSize: "12px" }}>{result.label}</span>
                      <span className="shrink-0 ml-auto" style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>{result.sublabel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile filters bottom sheet */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} />
            <div className="absolute bottom-0 left-0 right-0 p-5 pb-8" style={{ background: "#FFFFFF" }} onClick={e => e.stopPropagation()}>
              <div className="text-sm font-black mb-4" style={{ color: "#302020", fontFamily: "Inter, sans-serif" }}>Filters</div>
              <div className="text-xs font-bold mb-2" style={{ color: "#302020", fontFamily: "Inter, sans-serif" }}>Categories</div>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {CATEGORIES.map(cat => (
                  <button key={cat.key} onClick={() => toggleCategory(cat.key)} className="text-left px-3 py-3 text-sm font-bold min-h-[44px]" style={{ color: "#302020", background: activeCategories.has(cat.key) ? "rgba(45,35,35,0.08)" : "#FFFFFF", border: "2px solid #302020", cursor: "pointer" }}>
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="text-xs font-bold mb-2" style={{ color: "#302020", fontFamily: "Inter, sans-serif" }}>Rating</div>
              <div className="flex gap-2 mb-4">
                {[0, 3, 3.5, 4, 4.5].map(r => (
                  <button key={r} onClick={() => { setMinRating(r); setMobileMenuOpen(false); }} className="flex-1 py-3 text-sm font-bold min-h-[44px]" style={{ color: "#302020", background: minRating === r ? "rgba(45,35,35,0.08)" : "#FFFFFF", border: "2px solid #302020", cursor: "pointer" }}>
                    {r === 0 ? "All" : `${r}+`}
                  </button>
                ))}
              </div>
              <div className="text-center text-xs font-bold" style={{ color: "#302020" }}>{filteredStores.length.toLocaleString()} stores</div>
            </div>
          </div>
        )}

        {(catOpen || ratingOpen || searchOpen) && <div className="fixed inset-0" style={{ zIndex: 38 }} onClick={closeAll} />}

        {/* ══ CONTENT ══ */}
        {activeTab === "map" && (
        <div className="flex-1 relative overflow-hidden">
          {/* Floating Map/Cards toggle + Back + Add store */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            <button type="button" onClick={effectiveNav.length > 0 ? handleGoBack : undefined} className="header-btn flex items-center justify-center" style={{ width: "44px", height: "44px", background: "#302020", border: "1px solid rgba(97,68,57,0.5)", borderRadius: "50%", color: "rgba(255,255,255,0.5)", cursor: effectiveNav.length > 0 ? "pointer" : "default", opacity: effectiveNav.length > 0 ? 1 : 0.25, transition: "opacity 0.2s" }} title="Go back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div className="relative flex items-center" style={{ background: "#302020", backdropFilter: "blur(12px)", border: "1px solid rgba(97,68,57,0.5)", padding: "3px", borderRadius: "999px" }}>
              {/* Sliding indicator */}
              <div style={{ position: "absolute", top: "3px", left: view === "map" ? "3px" : "50%", width: "calc(50% - 3px)", height: "calc(100% - 6px)", background: "#614439", borderRadius: "999px", transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)", pointerEvents: "none" }} />
              {(["map", "cards"] as const).map(v => (
                <button key={v} type="button" onClick={() => { setView(v); closeAll(); }} className="relative font-bold uppercase" style={{ fontSize: "10px", letterSpacing: "0.12em", padding: "7px 20px", color: view === v ? "#fff" : "rgba(255,255,255,0.3)", background: "transparent", border: "none", cursor: "pointer", transition: "color 0.2s", zIndex: 1 }}>
                  {v === "map" ? "Map" : "Cards"}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => isLoggedIn ? setShowNewStoreForm(true) : setShowAuthPopup(true)} className="header-btn flex items-center justify-center" style={{ width: "44px", height: "44px", background: "#302020", border: "1px solid rgba(97,68,57,0.5)", borderRadius: "50%", color: "rgba(255,255,255,0.5)", cursor: "pointer" }} title="Propose a store">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
          </div>

          <div style={{ display: view === "map" ? "block" : "none", height: "100%" }}>
            <MapView stores={filteredStores} height="100%" visible={view === "map"} onStoreSelect={handleStoreSelect} onReady={handleMapReady} onZoomOut={handleZoomOutToWorld} onViewportChange={handleViewportChange} />
          </div>
          {view === "cards" && (
            <CardsView
              stores={filteredStores}
              navStack={effectiveNav}
              onNavigate={handleGeoSelect}
              onStoreSelect={handleStoreSelect}
            />
          )}
        </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="flex-1 relative overflow-hidden">
            <LeaderboardView />
          </div>
        )}

        {activeTab === "profile" && (
          <div className="flex-1 relative overflow-hidden">
            <ProfileView onAuthRequired={() => setShowAuthPopup(true)} />
          </div>
        )}

      </div>

      <StoreDetailModal key={selectedStore?.id ?? "empty"} store={selectedStore} onClose={handleCloseStore} isSaved={selectedStore ? savedIds.includes(selectedStore.id) : false} onToggleSave={handleToggleSave} />

      {marketNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(18,12,12,0.75)", backdropFilter: "blur(4px)" }} onClick={() => setMarketNotice(false)}>
          <div className="relative w-full max-w-sm p-8 text-center" style={{ background: "#302020" }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setMarketNotice(false)} className="header-btn absolute top-3 right-3" style={{ width: 32, height: 32, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <svg className="mx-auto mb-4" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            <h2 className="text-lg font-bold uppercase tracking-tight mb-2" style={{ color: "#fff", fontFamily: "'Montserrat', var(--font-display)" }}>Uppy Market</h2>
            <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              {isLoggedIn
                ? "You're on the waitlist. We'll notify you as soon as Uppy Market is available."
                : "The marketplace is coming soon. Sign up to join the waitlist."}
            </p>
            <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>Powered by Uppy</p>
          </div>
        </div>
      )}

      {showAuthPopup && <WaitlistPopup onClose={() => setShowAuthPopup(false)} />}
      {showNewStoreForm && <ProposalForm mode="new" onClose={() => setShowNewStoreForm(false)} onSuccess={() => setShowNewStoreForm(false)} />}

      {showOnboarding && (
        <OnboardingWall onComplete={() => {
          localStorage.setItem("uppy_map_onboarding_complete", "true");
          setShowOnboarding(false);
        }} stats={initialStats} />
      )}

      {showProfileSetup && !showOnboarding && (
        <ProfileSetup
          defaultName={user?.user_metadata?.full_name || user?.user_metadata?.name || ""}
          onComplete={() => {
            localStorage.setItem("uppy_map_profile_setup_done", "true");
            setShowProfileSetup(false);
          }}
        />
      )}

      <MobileBottomBar
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); closeAll(); }}
      />
    </>
  );
}
