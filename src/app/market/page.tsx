"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";

/* ── Integration partners for the scrolling ticker ── */
const INTEGRATIONS = [
  "Shopify",
  "WooCommerce",
  "eBay",
  "Discogs",
  "Etsy",
  "Depop",
  "Vinted",
  "Square",
  "Lightspeed",
  "BigCommerce",
];

/* ── Store categories ── */
const CATEGORIES = [
  { name: "Vintage", desc: "Decades of character. Pre-loved pieces from the '50s to the '00s." },
  { name: "Thrift", desc: "The hunt is the point. Affordable, unpredictable, always rewarding." },
  { name: "Designer Resale", desc: "Authenticated luxury. Second owners, first-class pieces." },
  { name: "Streetwear", desc: "Deadstock drops and grails. The culture, not the hype machine." },
  { name: "Antique", desc: "Before fast fashion existed. Craftsmanship that outlived its era." },
  { name: "Consignment", desc: "Curated by store owners who know what matters." },
  { name: "Flea Market", desc: "The chaos is the charm. One-of-a-kind everything." },
  { name: "Charity", desc: "Every purchase gives twice. Style with a conscience." },
  { name: "Outlet", desc: "Overstock from brands that care. Discounted, not discarded." },
  { name: "Curated", desc: "Handpicked by people with taste. No algorithm needed." },
];

/* ── Commission comparison ── */
const COMPETITORS = [
  { name: "Depop", rate: "10%", note: "seller fee" },
  { name: "Vinted", rate: "5%+", note: "buyer protection" },
  { name: "eBay", rate: "13%", note: "final value" },
  { name: "Etsy", rate: "6.5%", note: "+ listing fees" },
  { name: "Poshmark", rate: "20%", note: "flat rate" },
];

export default function MarketPage() {
  const { isLoggedIn } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

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
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#2D2323" }}>
      <PageHeader activePage="market" />

      {/* ═══════════════════════════════════════════════
          WAITLIST BANNER — cream strip, always visible
          ═══════════════════════════════════════════════ */}
      <div style={{ background: "#EBE9D9" }}>
        <div className="mx-auto max-w-[1200px] px-6 py-3.5 flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-center sm:text-left flex-1" style={{ color: "#2D2323" }}>
            {submitted
              ? "You're on the list. We'll be in touch."
              : "Üppy Market is launching soon — join the waitlist"}
          </p>
          {!submitted && (
            <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 sm:w-60 px-3.5 py-2.5 text-xs"
                style={{ background: "transparent", border: "1.5px solid rgba(45,35,35,0.25)", color: "#2D2323", outline: "none" }}
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] shrink-0"
                style={{ background: "#2D2323", color: "#EBE9D9", border: "none", cursor: "pointer", opacity: submitting ? 0.5 : 1 }}
              >
                {submitting ? "..." : "Join"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          HERO — The claim, big and breathing
          ═══════════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1200px] px-6 pt-24 sm:pt-32 pb-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-8" style={{ color: "#A58277" }}>
            Üppy Market
          </p>
          <h1
            className="text-[clamp(2.2rem,6vw,4.5rem)] font-black uppercase leading-[0.95] tracking-[-0.03em] mb-8"
            style={{ color: "#fff", fontFamily: "var(--font-display)" }}
          >
            First Hand<br />
            Experience in<br />
            Secondhand Love
          </h1>
          <p className="text-sm sm:text-base leading-[1.7] max-w-lg" style={{ color: "rgba(255,255,255,0.5)" }}>
            The marketplace that connects you directly with independent vintage,
            thrift, and secondhand stores worldwide. No middlemen. No fast fashion.
            Every purchase supports a real store, run by real people.
          </p>
        </div>
      </section>

      {/* ── Hero visual placeholder (16:9) ── */}
      <section className="mx-auto max-w-[1200px] px-6 pb-24 sm:pb-32">
        <div
          className="w-full overflow-hidden"
          style={{
            aspectRatio: "16 / 9",
            background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Replace with your iPhone 3D render / video */}
          <div className="w-full h-full flex items-center justify-center">
            <Image src="/branding/logo.svg" alt="" width={100} height={34} style={{ opacity: 0.06 }} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          INTEGRATION TICKER — infinite scroll logos
          ═══════════════════════════════════════════════ */}
      <section
        className="overflow-hidden py-6"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3 mb-5 px-6 max-w-[1200px] mx-auto">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
            Sync with your existing tools
          </span>
          <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
        <div className="relative">
          <div className="flex animate-[ticker_30s_linear_infinite] w-max">
            {[...INTEGRATIONS, ...INTEGRATIONS, ...INTEGRATIONS].map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="flex items-center justify-center shrink-0 mx-6 sm:mx-10"
              >
                <span
                  className="text-sm sm:text-base font-bold uppercase tracking-[0.08em] whitespace-nowrap select-none"
                  style={{ color: "rgba(255,255,255,0.18)" }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          WHAT IS ÜPPY MARKET — editorial two-column
          ═══════════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1200px] px-6 py-24 sm:py-32">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#A58277" }}>
              The problem
            </p>
            <h2
              className="text-2xl sm:text-3xl font-black uppercase leading-[1.05] tracking-[-0.02em] mb-6"
              style={{ color: "#fff", fontFamily: "var(--font-display)" }}
            >
              Independent stores<br />
              are invisible online
            </h2>
            <p className="text-sm leading-[1.8]" style={{ color: "rgba(255,255,255,0.45)" }}>
              The best secondhand stores in the world — the ones with real curation, decades of
              expertise, and racks full of pieces you won't find anywhere else — have no way to
              reach you online. They're buried under marketplace algorithms that favor volume
              over quality, fast fashion over slow finds.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#A58277" }}>
              The answer
            </p>
            <h2
              className="text-2xl sm:text-3xl font-black uppercase leading-[1.05] tracking-[-0.02em] mb-6"
              style={{ color: "#fff", fontFamily: "var(--font-display)" }}
            >
              A marketplace built<br />
              for the stores first
            </h2>
            <p className="text-sm leading-[1.8]" style={{ color: "rgba(255,255,255,0.45)" }}>
              Üppy Market gives independent stores the infrastructure they deserve — real
              visibility, fair commissions, and tools that sync with what they already use. No
              listing fees. No buried results. Just the store's own pieces, presented the way the
              store intends, reaching the people who actually care.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CATEGORIES — horizontal scroll, editorial cards
          ═══════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32" style={{ background: "#EBE9D9" }}>
        <div className="mx-auto max-w-[1200px] px-6 mb-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#A58277" }}>
            10 categories
          </p>
          <h2
            className="text-2xl sm:text-3xl font-black uppercase leading-[1.05] tracking-[-0.02em]"
            style={{ color: "#2D2323", fontFamily: "var(--font-display)" }}
          >
            Every corner of secondhand
          </h2>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 px-6 pb-2" style={{ minWidth: "max-content" }}>
            {CATEGORIES.map((cat, i) => (
              <div
                key={cat.name}
                className="shrink-0 flex flex-col justify-end p-6"
                style={{
                  width: 260,
                  height: 320,
                  background: `linear-gradient(180deg, rgba(45,35,35,${0.03 + i * 0.008}) 0%, rgba(45,35,35,${0.06 + i * 0.01}) 100%)`,
                  border: "1px solid rgba(45,35,35,0.08)",
                }}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] mb-2" style={{ color: "#A58277" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3
                  className="text-lg font-black uppercase tracking-[-0.01em] mb-3 leading-tight"
                  style={{ color: "#2D2323", fontFamily: "var(--font-display)" }}
                >
                  {cat.name}
                </h3>
                <p className="text-xs leading-[1.6]" style={{ color: "rgba(45,35,35,0.55)" }}>
                  {cat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS — three numbered steps
          ═══════════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1200px] px-6 py-24 sm:py-32">
        <div className="mb-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#A58277" }}>
            How it works
          </p>
          <h2
            className="text-2xl sm:text-3xl font-black uppercase leading-[1.05] tracking-[-0.02em]"
            style={{ color: "#fff", fontFamily: "var(--font-display)" }}
          >
            Three steps to better<br />
            secondhand shopping
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
          {[
            {
              num: "01",
              title: "Discover",
              desc: "Browse pieces from 9,000+ stores across 60 countries. Filter by city, category, or style. Every store is real, verified by the community.",
            },
            {
              num: "02",
              title: "Buy",
              desc: "Purchase directly from the store with secure checkout. No bidding wars, no bots. Just a fair price set by people who know what a piece is worth.",
            },
            {
              num: "03",
              title: "Collect",
              desc: "Build your network of favorite stores. Earn points by reviewing, photographing, and contributing. The more you give, the more you unlock.",
            },
          ].map((step) => (
            <div key={step.num} className="p-8 sm:p-10" style={{ background: "#2D2323" }}>
              <span className="text-[10px] font-bold tracking-[0.16em] block mb-6" style={{ color: "#A58277" }}>
                {step.num}
              </span>
              <h3
                className="text-base font-black uppercase tracking-[-0.01em] mb-4"
                style={{ color: "#fff", fontFamily: "var(--font-display)" }}
              >
                {step.title}
              </h3>
              <p className="text-xs leading-[1.7]" style={{ color: "rgba(255,255,255,0.45)" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FOR STORES — dark section, emphasis on economics
          ═══════════════════════════════════════════════ */}
      <section
        className="py-24 sm:py-32"
        style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 lg:gap-24">
            {/* Left — copy */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#A58277" }}>
                For stores
              </p>
              <h2
                className="text-2xl sm:text-3xl font-black uppercase leading-[1.05] tracking-[-0.02em] mb-6"
                style={{ color: "#fff", fontFamily: "var(--font-display)" }}
              >
                Built for the<br />
                shops that care
              </h2>
              <p className="text-sm leading-[1.8] mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
                Üppy Market was designed alongside independent store owners. We know
                your margins are tight and your time is limited. That's why we charge the
                lowest commissions in the industry, with zero listing fees and zero monthly costs.
              </p>
              <div className="flex flex-col gap-5">
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
                      <span className="text-xs block mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{item.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — commission comparison */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>
                Commission comparison
              </p>

              {/* Competitors */}
              <div className="flex flex-col gap-3 mb-6">
                {COMPETITORS.map((c) => (
                  <div key={c.name} className="flex items-center gap-4 py-3 px-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-xs font-bold uppercase tracking-[0.06em] w-24 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {c.name}
                    </span>
                    <div className="flex-1 h-2 relative" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="absolute inset-y-0 left-0"
                        style={{ width: `${parseFloat(c.rate) * 5}%`, background: "rgba(255,255,255,0.12)" }}
                      />
                    </div>
                    <span className="text-sm font-bold w-16 text-right shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {c.rate}
                    </span>
                  </div>
                ))}
              </div>

              {/* Üppy */}
              <div className="flex items-center gap-4 py-4 px-5" style={{ border: "1.5px solid #A58277" }}>
                <span className="text-xs font-bold uppercase tracking-[0.06em] w-24 shrink-0" style={{ color: "#A58277" }}>
                  Üppy
                </span>
                <div className="flex-1 h-2 relative" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="absolute inset-y-0 left-0"
                    style={{ width: "15%", background: "#A58277" }}
                  />
                </div>
                <span className="text-sm font-bold w-16 text-right shrink-0" style={{ color: "#A58277" }}>
                  3%
                </span>
              </div>
              <p className="text-[10px] mt-3 tracking-[0.04em]" style={{ color: "rgba(255,255,255,0.25)" }}>
                + standard payment processing. No hidden fees. No listing costs. No monthly subscription.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          STATS STRIP — full-width, minimal
          ═══════════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1200px] px-6 py-20 sm:py-24">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-4">
          {[
            { value: "9,000+", label: "Independent stores" },
            { value: "60+", label: "Countries" },
            { value: "230+", label: "Cities" },
            { value: "3%", label: "Commission" },
          ].map((stat) => (
            <div key={stat.label}>
              <span
                className="text-2xl sm:text-4xl font-black uppercase tracking-[-0.03em] block"
                style={{ color: "#fff", fontFamily: "var(--font-display)" }}
              >
                {stat.value}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] block mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          BOTTOM CTA — cream section, full-width
          ═══════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32" style={{ background: "#EBE9D9" }}>
        <div className="mx-auto max-w-[1200px] px-6 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#A58277" }}>
              Coming 2026
            </p>
            <h2
              className="text-3xl sm:text-5xl font-black uppercase leading-[0.95] tracking-[-0.03em]"
              style={{ color: "#2D2323", fontFamily: "var(--font-display)" }}
            >
              Be part of the<br />
              first wave
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center h-12 px-8 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ background: "#2D2323", color: "#EBE9D9", textDecoration: "none" }}
            >
              Explore the map
            </Link>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center justify-center h-12 px-8 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ background: "transparent", color: "#2D2323", border: "1.5px solid rgba(45,35,35,0.25)", cursor: "pointer" }}
            >
              Join the waitlist
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════ */}
      <footer className="px-6 py-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-[1200px] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Image src="/branding/logo-white.svg" alt="Üppy" width={60} height={18} style={{ filter: "brightness(10)", opacity: 0.25 }} />
            <Link href="/" className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.2)", textDecoration: "none" }}>
              Map
            </Link>
            <Link href="/leaderboard" className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.2)", textDecoration: "none" }}>
              Leaderboard
            </Link>
          </div>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>
            &copy; {new Date().getFullYear()} Üppy. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
