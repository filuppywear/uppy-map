"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

/* ═══════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════ */

const CATEGORIES = [
  { name: "Vintage", slug: "vintage", desc: "Decades of character. Pre-loved pieces from the '50s to the '00s." },
  { name: "Thrift", slug: "thrift", desc: "The hunt is the point. Affordable, unpredictable, always rewarding." },
  { name: "Designer Resale", slug: "designer-resale", desc: "Authenticated luxury. Second owners, first-class pieces." },
  { name: "Streetwear", slug: "streetwear", desc: "Deadstock drops and grails. The culture, not the hype machine." },
  { name: "Antique", slug: "antique", desc: "Before fast fashion existed. Craftsmanship that outlived its era." },
  { name: "Consignment", slug: "consignment", desc: "Curated by store owners who know what matters." },
  { name: "Flea Market", slug: "flea-market", desc: "The chaos is the charm. One-of-a-kind everything." },
  { name: "Charity", slug: "charity", desc: "Every purchase gives twice. Style with a conscience." },
  { name: "Outlet", slug: "outlet", desc: "Overstock from brands that care. Discounted, not discarded." },
  { name: "Curated", slug: "curated", desc: "Handpicked by people with taste. No algorithm required." },
];

const COMPETITORS = [
  { name: "Poshmark", rate: 20, label: "20%" },
  { name: "eBay", rate: 13, label: "13%" },
  { name: "Depop", rate: 10, label: "10%" },
  { name: "Etsy", rate: 6.5, label: "6.5%" },
  { name: "Vinted", rate: 5, label: "5%+" },
];

/* Gradient palette for category cards (before real photos are added) */
const CAT_GRADIENTS = [
  "linear-gradient(145deg, #3d2e2e 0%, #4a3535 100%)",
  "linear-gradient(145deg, #2e3530 0%, #354a3a 100%)",
  "linear-gradient(145deg, #352e3d 0%, #4a3545 100%)",
  "linear-gradient(145deg, #2e3035 0%, #35404a 100%)",
  "linear-gradient(145deg, #3d352e 0%, #4a4035 100%)",
  "linear-gradient(145deg, #35302e 0%, #4a4240 100%)",
  "linear-gradient(145deg, #2e353d 0%, #35454a 100%)",
  "linear-gradient(145deg, #3d2e35 0%, #4a3540 100%)",
  "linear-gradient(145deg, #303d2e 0%, #3f4a35 100%)",
  "linear-gradient(145deg, #352e30 0%, #4a353a 100%)",
];

/* ═══════════════════════════════════════════════════════
   INTEGRATION LOGO SVGs
   ═══════════════════════════════════════════════════════ */

function IntegrationLogo({ name }: { name: string }) {
  const h = 26;
  const common = { height: h, role: "img" as const, "aria-label": name };

  switch (name) {
    case "Shopify":
      return (
        <svg viewBox="0 0 120 32" {...common}>
          <text x="60" y="22" textAnchor="middle" fill="#95BF47" fontWeight="800" fontStyle="italic" fontSize="22" fontFamily="sans-serif">shopify</text>
        </svg>
      );
    case "WooCommerce":
      return (
        <svg viewBox="0 0 160 32" {...common}>
          <text x="80" y="22" textAnchor="middle" fill="#7F54B3" fontWeight="700" fontSize="20" fontFamily="'Arial Rounded MT Bold',sans-serif">woocommerce</text>
        </svg>
      );
    case "eBay":
      return (
        <svg viewBox="0 0 80 32" {...common}>
          <text x="0" y="23" fontWeight="700" fontSize="24" fontFamily="sans-serif">
            <tspan fill="#E53238">e</tspan>
            <tspan fill="#0064D2">B</tspan>
            <tspan fill="#F5AF02">a</tspan>
            <tspan fill="#86B817">y</tspan>
          </text>
        </svg>
      );
    case "Discogs":
      return (
        <svg viewBox="0 0 110 32" {...common}>
          <text x="55" y="22" textAnchor="middle" fill="#fff" fontWeight="900" fontSize="20" fontFamily="sans-serif" letterSpacing="-0.5" textDecoration="none">DISCOGS</text>
        </svg>
      );
    case "Etsy":
      return (
        <svg viewBox="0 0 70 32" {...common}>
          <text x="35" y="23" textAnchor="middle" fill="#F56400" fontWeight="700" fontStyle="italic" fontSize="24" fontFamily="Georgia,serif">Etsy</text>
        </svg>
      );
    case "Depop":
      return (
        <svg viewBox="0 0 90 32" {...common}>
          <text x="45" y="23" textAnchor="middle" fill="#fff" fontWeight="900" fontSize="22" fontFamily="'Arial Black',sans-serif" letterSpacing="-0.5">depop</text>
        </svg>
      );
    case "Vinted":
      return (
        <svg viewBox="0 0 100 32" {...common}>
          <text x="50" y="22" textAnchor="middle" fill="#09B1BA" fontWeight="600" fontSize="22" fontFamily="sans-serif">vinted</text>
        </svg>
      );
    case "Square":
      return (
        <svg viewBox="0 0 100 32" {...common}>
          <text x="50" y="22" textAnchor="middle" fill="#fff" fontWeight="500" fontSize="21" fontFamily="'Helvetica Neue',sans-serif" letterSpacing="0.5">Square</text>
        </svg>
      );
    case "Lightspeed":
      return (
        <svg viewBox="0 0 140 32" {...common}>
          <text x="70" y="22" textAnchor="middle" fill="#E4002B" fontWeight="800" fontSize="18" fontFamily="sans-serif" letterSpacing="-0.3">LIGHTSPEED</text>
        </svg>
      );
    case "BigCommerce":
      return (
        <svg viewBox="0 0 150 32" {...common}>
          <text x="75" y="22" textAnchor="middle" fill="#fff" fontWeight="600" fontSize="19" fontFamily="sans-serif">BigCommerce</text>
        </svg>
      );
    default:
      return <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 700, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>{name}</span>;
  }
}

const INTEGRATION_NAMES = ["Shopify", "WooCommerce", "eBay", "Discogs", "Etsy", "Depop", "Vinted", "Square", "Lightspeed", "BigCommerce"];

/* ═══════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════ */

export default function MarketPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const barsRef = useRef<HTMLDivElement>(null);
  const [barsVisible, setBarsVisible] = useState(false);

  /* Scroll reveal */
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -50px 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* Commission bars animation trigger */
  useEffect(() => {
    if (!barsRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setBarsVisible(true); obs.disconnect(); } },
      { threshold: 0.3 },
    );
    obs.observe(barsRef.current);
    return () => obs.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role: "buyer", source: "market_landing" }),
      });
      setSubmitted(true);
    } catch { /* silent */ } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#2D2323" }}>
      <PageHeader activePage="market" />

      {/* ════════════════════════════════════════════
          1 · WAITLIST BANNER
          ════════════════════════════════════════════ */}
      <div style={{ background: "#EBE9D9" }}>
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-3.5 flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-center sm:text-left flex-1" style={{ color: "#2D2323" }}>
            {submitted ? "You're on the list. We'll be in touch." : "Üppy Market is launching soon — join the waitlist"}
          </p>
          {!submitted && (
            <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required className="flex-1 sm:w-60 px-3.5 py-2.5 text-xs" style={{ background: "transparent", border: "1.5px solid rgba(45,35,35,0.22)", color: "#2D2323", outline: "none" }} />
              <button type="submit" disabled={submitting} className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] shrink-0" style={{ background: "#2D2323", color: "#EBE9D9", border: "none", cursor: "pointer", opacity: submitting ? 0.5 : 1 }}>
                {submitting ? "..." : "Join"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          2 · HERO
          ════════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-20 sm:pt-28 lg:pt-36 pb-16 lg:pb-28">
        <div className="grid lg:grid-cols-[1fr_0.8fr] gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <span className="w-2 h-2 shrink-0" style={{ background: "#A58277", animation: "pulse-dot 2.5s ease-in-out infinite" }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#A58277" }}>Üppy Market</span>
            </div>

            <h1 className="mb-8" style={{ fontFamily: "var(--font-display)" }}>
              {["First Hand", "Experience in", "Secondhand", "Love"].map((line, i) => (
                <span
                  key={line}
                  className="block"
                  style={{
                    fontSize: "clamp(2.8rem, 7.5vw, 6rem)",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    lineHeight: 0.92,
                    letterSpacing: "-0.04em",
                    color: line === "Secondhand" ? "#A58277" : "#fff",
                    animation: `hero-text-reveal 0.9s cubic-bezier(0.16,1,0.3,1) ${i * 0.12}s both`,
                  }}
                >
                  {line}
                </span>
              ))}
            </h1>

            <p className="text-sm sm:text-[15px] leading-[1.75] max-w-md mb-10" style={{ color: "rgba(255,255,255,0.48)", animation: "hero-text-reveal 0.9s cubic-bezier(0.16,1,0.3,1) 0.5s both" }}>
              The marketplace that connects you directly with independent vintage,
              thrift, and secondhand stores worldwide. No middlemen. No fast fashion.
              Every purchase supports a real store, run by real people.
            </p>

            <div className="flex flex-wrap gap-3" style={{ animation: "hero-text-reveal 0.9s cubic-bezier(0.16,1,0.3,1) 0.65s both" }}>
              <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="h-13 px-8 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ height: 52, background: "#EBE9D9", color: "#2D2323", border: "none", cursor: "pointer" }}>
                Join the waitlist
              </button>
              <Link href="/" className="flex items-center justify-center h-13 px-8 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ height: 52, background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.18)", textDecoration: "none" }}>
                Explore the map
              </Link>
            </div>
          </div>

          {/* Right — device placeholder */}
          <div className="flex justify-center lg:justify-end" style={{ animation: "hero-text-reveal 1.1s cubic-bezier(0.16,1,0.3,1) 0.4s both" }}>
            <div
              className="w-full max-w-[320px] lg:max-w-none flex items-center justify-center overflow-hidden"
              style={{
                aspectRatio: "9 / 16",
                background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 24,
              }}
            >
              {/* Replace with iPhone 3D mockup / video */}
              <Image src="/branding/logo.svg" alt="" width={80} height={28} style={{ opacity: 0.06 }} />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          3 · INTEGRATION TICKER
          ════════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-5 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(255,255,255,0.25)" }}>
            Sync with your existing tools
          </span>
        </div>
        <div className="ticker-mask overflow-hidden py-5">
          <div className="flex w-max" style={{ animation: "ticker-scroll 45s linear infinite" }}>
            {[...INTEGRATION_NAMES, ...INTEGRATION_NAMES].map((name, i) => (
              <div key={`${name}-${i}`} className="flex items-center justify-center shrink-0 mx-8 sm:mx-12" style={{ opacity: 0.4 }}>
                <IntegrationLogo name={name} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          4 · PROBLEM / SOLUTION
          ════════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 sm:py-32 lg:py-40">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-28">
          {/* The problem */}
          <div className="reveal" style={{ borderLeft: "2px solid #A58277", paddingLeft: 32 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#A58277" }}>The problem</p>
            <h2 className="text-2xl sm:text-[2rem] font-black uppercase leading-[1.05] tracking-[-0.02em] mb-6" style={{ color: "#fff", fontFamily: "var(--font-display)" }}>
              Independent stores are invisible online
            </h2>
            <p className="text-sm leading-[1.85]" style={{ color: "rgba(255,255,255,0.42)" }}>
              The best secondhand stores in the world — the ones with real curation, decades of
              expertise, and racks full of pieces you won't find anywhere else — have no way to
              reach you online. They're buried under marketplace algorithms that favor volume
              over quality, fast fashion over slow finds. The stores that care the most earn the least visibility.
            </p>
          </div>

          {/* The answer */}
          <div className="reveal reveal-d2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#A58277" }}>The answer</p>
            <span className="block font-black uppercase leading-none tracking-[-0.04em]" style={{ fontSize: "clamp(4rem, 9vw, 7rem)", color: "#A58277", opacity: 0.13, fontFamily: "var(--font-display)" }}>3%</span>
            <h2 className="text-2xl sm:text-[2rem] font-black uppercase leading-[1.05] tracking-[-0.02em] mb-6 -mt-4" style={{ color: "#fff", fontFamily: "var(--font-display)" }}>
              A marketplace built for the stores first
            </h2>
            <p className="text-sm leading-[1.85]" style={{ color: "rgba(255,255,255,0.42)" }}>
              Üppy Market gives independent stores the infrastructure they deserve — real
              visibility, the lowest commissions in the industry, and tools that sync with what
              they already use. No listing fees. No buried results. Just the store's own pieces,
              presented the way the store intends, reaching the people who actually care.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          5 · CATEGORIES
          ════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 lg:py-36" style={{ background: "#EBE9D9" }}>
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 mb-10">
          <div className="reveal">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#A58277" }}>10 categories</p>
            <h2 className="text-2xl sm:text-[2rem] font-black uppercase leading-[1.05] tracking-[-0.02em]" style={{ color: "#2D2323", fontFamily: "var(--font-display)" }}>
              Every corner of secondhand
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
          <div className="flex gap-4 px-6 lg:px-10 pb-3" style={{ minWidth: "max-content" }}>
            {CATEGORIES.map((cat, i) => (
              <div
                key={cat.slug}
                className="cat-card shrink-0 relative flex flex-col justify-end overflow-hidden"
                style={{
                  width: 300,
                  height: 400,
                  scrollSnapAlign: "start",
                  background: CAT_GRADIENTS[i],
                }}
              >
                {/* Dark overlay at bottom for text readability */}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(45,35,35,0.88) 0%, rgba(45,35,35,0.15) 45%, transparent 100%)" }} />

                <div className="relative p-7">
                  <span className="text-[10px] font-bold tracking-[0.16em] block mb-2" style={{ color: "#A58277" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg font-black uppercase tracking-[-0.01em] mb-2.5 leading-tight" style={{ color: "#fff", fontFamily: "var(--font-display)" }}>
                    {cat.name}
                  </h3>
                  <p className="text-[11px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {cat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          6 · HOW IT WORKS
          ════════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 sm:py-32 lg:py-40">
        <div className="reveal mb-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#A58277" }}>How it works</p>
          <h2 className="text-2xl sm:text-[2rem] font-black uppercase leading-[1.05] tracking-[-0.02em]" style={{ color: "#fff", fontFamily: "var(--font-display)" }}>
            Three steps to better<br />secondhand shopping
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
          {[
            {
              num: "01",
              title: "Discover",
              icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A58277" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
              desc: "Browse pieces from 9,000+ stores across 60 countries. Filter by city, category, or style. Every store is real, verified by the community.",
            },
            {
              num: "02",
              title: "Buy",
              icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A58277" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
              desc: "Purchase directly from the store with secure checkout. No bidding wars, no bots. Just a fair price set by people who know what a piece is worth.",
            },
            {
              num: "03",
              title: "Collect",
              icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A58277" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
              desc: "Build your network of favorite stores. Earn points by reviewing, photographing, and contributing. The more you give, the more you unlock.",
            },
          ].map((step) => (
            <div key={step.num} className="reveal relative p-8 sm:p-12 overflow-hidden" style={{ background: "#2D2323" }}>
              {/* Watermark number */}
              <span className="absolute -right-2 -top-6 font-black uppercase select-none pointer-events-none" style={{ fontSize: "clamp(5rem, 12vw, 9rem)", color: "#A58277", opacity: 0.06, fontFamily: "var(--font-display)", lineHeight: 1 }}>
                {step.num}
              </span>

              <div className="relative">
                <div className="mb-5">{step.icon}</div>
                <span className="text-[10px] font-bold tracking-[0.16em] block mb-4" style={{ color: "#A58277" }}>{step.num}</span>
                <h3 className="text-base font-black uppercase tracking-[-0.01em] mb-4" style={{ color: "#fff", fontFamily: "var(--font-display)" }}>
                  {step.title}
                </h3>
                <p className="text-xs leading-[1.75]" style={{ color: "rgba(255,255,255,0.42)" }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          7 · FOR STORES + COMMISSION CHART
          ════════════════════════════════════════════ */}
      <section
        className="py-24 sm:py-32 lg:py-40"
        style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="grid lg:grid-cols-[1fr_1.3fr] gap-16 lg:gap-24">
            {/* Left — copy */}
            <div className="reveal">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#A58277" }}>For stores</p>
              <h2 className="text-2xl sm:text-[2rem] font-black uppercase leading-[1.05] tracking-[-0.02em] mb-6" style={{ color: "#fff", fontFamily: "var(--font-display)" }}>
                Built for the shops that care
              </h2>
              <p className="text-sm leading-[1.8] mb-10" style={{ color: "rgba(255,255,255,0.42)" }}>
                Üppy Market was designed alongside independent store owners. We know
                your margins are tight and your time is limited. That's why we charge the
                lowest commissions in the industry — with zero listing fees and zero monthly costs.
              </p>
              <div className="flex flex-col gap-6">
                {[
                  { label: "3% commission", sub: "The lowest in the industry. Period." },
                  { label: "Zero listing fees", sub: "List unlimited pieces. We only earn when you do." },
                  { label: "Sync your tools", sub: "Connect Shopify, WooCommerce, Square, or manage manually." },
                  { label: "Your brand, your page", sub: "Your store identity stays front and center. Always." },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <span className="shrink-0 w-1.5 h-1.5 mt-2" style={{ background: "#A58277" }} />
                    <div>
                      <span className="text-sm font-bold block" style={{ color: "#fff" }}>{item.label}</span>
                      <span className="text-xs block mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>{item.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — commission chart */}
            <div className="reveal reveal-d2" ref={barsRef}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] mb-8" style={{ color: "rgba(255,255,255,0.25)" }}>
                Commission comparison
              </p>

              <div className="flex flex-col gap-3 mb-5">
                {COMPETITORS.map((c) => (
                  <div key={c.name} className="flex items-center gap-4 py-3.5 px-5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-[11px] font-bold uppercase tracking-[0.06em] w-24 shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {c.name}
                    </span>
                    <div className="flex-1 h-2.5 relative" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div
                        className={barsVisible ? "bar-anim" : ""}
                        style={{ position: "absolute", inset: "0 auto 0 0", background: "rgba(255,255,255,0.12)", "--bar-w": `${(c.rate / 22) * 100}%` } as React.CSSProperties}
                      />
                    </div>
                    <span className="text-sm font-bold w-14 text-right shrink-0" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Üppy row */}
              <div className="flex items-center gap-4 py-4 px-5" style={{ border: "1.5px solid #A58277" }}>
                <span className="text-[11px] font-bold uppercase tracking-[0.06em] w-24 shrink-0" style={{ color: "#A58277" }}>Üppy</span>
                <div className="flex-1 h-2.5 relative" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div
                    className={barsVisible ? "bar-anim" : ""}
                    style={{ position: "absolute", inset: "0 auto 0 0", background: "#A58277", "--bar-w": `${(3 / 22) * 100}%` } as React.CSSProperties}
                  />
                </div>
                <span className="text-sm font-bold w-14 text-right shrink-0" style={{ color: "#A58277" }}>3%</span>
              </div>

              <p className="text-[11px] mt-5 leading-[1.6]" style={{ color: "rgba(255,255,255,0.22)" }}>
                + standard payment processing. No hidden fees. No listing costs. No monthly subscription.
              </p>
              <p className="text-xs mt-4 font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
                Sell a $100 item on eBay: <span style={{ color: "rgba(255,255,255,0.6)" }}>$13 in fees</span>. On Üppy: <span style={{ color: "#A58277" }}>$3</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          8 · STATS
          ════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28" style={{ background: "#EBE9D9" }}>
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 sm:gap-6">
            {[
              { value: "9,000+", label: "Independent stores" },
              { value: "60+", label: "Countries" },
              { value: "230+", label: "Cities" },
              { value: "3%", label: "Commission" },
            ].map((stat) => (
              <div key={stat.label} className="reveal">
                <span className="block font-black uppercase tracking-[-0.03em]" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#2D2323", fontFamily: "var(--font-display)", lineHeight: 1 }}>
                  {stat.value}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] block mt-2" style={{ color: "rgba(45,35,35,0.4)" }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          9 · BOTTOM CTA
          ════════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-28 sm:py-36 lg:py-44 text-center">
        <div className="reveal">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#A58277" }}>Coming 2026</p>
          <h2 className="text-3xl sm:text-[clamp(2.5rem,5vw,4rem)] font-black uppercase leading-[0.95] tracking-[-0.03em] mb-6" style={{ color: "#fff", fontFamily: "var(--font-display)" }}>
            Be part of the<br />first wave
          </h2>
          <p className="text-sm mb-10 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.38)" }}>
            We'll notify you when Üppy Market goes live. Early members get priority access.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="h-13 px-8 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ height: 52, background: "#EBE9D9", color: "#2D2323", border: "none", cursor: "pointer" }}>
              Join the waitlist
            </button>
            <Link href="/" className="flex items-center justify-center h-13 px-8 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ height: 52, background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.18)", textDecoration: "none" }}>
              Explore the map
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          10 · FOOTER
          ════════════════════════════════════════════ */}
      <footer className="px-6 lg:px-10 py-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-[1400px] flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-7">
            <Image src="/branding/logo-white.svg" alt="Üppy" width={56} height={17} style={{ filter: "brightness(10)", opacity: 0.2 }} />
            <Link href="/" className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.18)", textDecoration: "none" }}>Map</Link>
            <Link href="/leaderboard" className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.18)", textDecoration: "none" }}>Leaderboard</Link>
          </div>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.12)" }}>&copy; {new Date().getFullYear()} Üppy. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
