"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";

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

      {/* ── Waitlist banner ── */}
      <div style={{ background: "#EBE9D9" }}>
        <div className="mx-auto max-w-3xl px-5 py-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
          <p className="text-xs font-bold uppercase tracking-widest text-center sm:text-left flex-1" style={{ color: "#2D2323", letterSpacing: "0.12em" }}>
            {submitted ? "You're on the list." : "Uppy Market is coming soon. Join the waitlist."}
          </p>
          {!submitted && (
            <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 sm:w-56 px-3 py-2 text-xs"
                style={{ background: "#fff", border: "1px solid rgba(45,35,35,0.15)", color: "#2D2323", outline: "none" }}
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider shrink-0"
                style={{ background: "#2D2323", color: "#EBE9D9", border: "none", cursor: "pointer", opacity: submitting ? 0.5 : 1 }}
              >
                {submitting ? "..." : "Join"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-4xl px-5 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.5)" }}>Coming 2026</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-[1.1] mb-5" style={{ color: "#fff", fontFamily: "'Montserrat', var(--font-display)" }}>
          The marketplace<br />for independent stores
        </h1>
        <p className="text-sm sm:text-base leading-relaxed max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
          Buy and sell curated secondhand pieces directly from the world's best vintage
          and thrift stores. No fast fashion. No algorithms. Just real stores, real finds.
        </p>
      </section>

      {/* ── Image placeholder — drop your hero visual here ── */}
      <section className="mx-auto max-w-5xl px-5 mb-16">
        <div className="w-full" style={{ aspectRatio: "16 / 9", background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))" }}>
          {/* Replace with: <img src="/market/hero.jpg" className="w-full h-full object-cover" /> */}
          <div className="w-full h-full flex items-center justify-center">
            <Image src="/branding/logo.svg" alt="" width={120} height={40} style={{ opacity: 0.08 }} />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-4xl px-5 pb-20">
        <h2 className="text-lg font-bold uppercase tracking-tight text-center mb-12" style={{ color: "#fff", fontFamily: "'Montserrat', var(--font-display)" }}>
          How it works
        </h2>

        <div className="grid sm:grid-cols-3 gap-8 sm:gap-10">
          {[
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              ),
              title: "Discover",
              desc: "Browse curated pieces from 9,000+ independent stores across 60 countries, organized by city.",
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              ),
              title: "Buy",
              desc: "Purchase directly from stores with secure checkout. Every sale supports a real, independent business.",
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              ),
              title: "Collect",
              desc: "Save your favorite stores, earn points by contributing, and unlock perks as you explore.",
            },
          ].map((step) => (
            <div key={step.title} className="text-center sm:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                {step.icon}
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: "#fff" }}>
                {step.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── For stores ── */}
      <section className="py-16" style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="text-lg font-bold uppercase tracking-tight text-center mb-4" style={{ color: "#fff", fontFamily: "'Montserrat', var(--font-display)" }}>
            For stores
          </h2>
          <p className="text-sm leading-relaxed text-center max-w-lg mx-auto mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
            List your pieces on Uppy Market and reach conscious buyers worldwide.
            No listing fees. Built for independent retailers, not corporations.
          </p>

          <div className="grid sm:grid-cols-3 gap-6">
            {["Zero listing fees", "Global reach, local soul", "Your store, your brand"].map((item) => (
              <div key={item} className="p-5 text-center" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-4" style={{ color: "#fff", fontFamily: "'Montserrat', var(--font-display)" }}>
          Be the first to know
        </h2>
        <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
          We'll notify you when Uppy Market goes live.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 text-xs font-bold uppercase tracking-wider"
          style={{ background: "#EBE9D9", color: "#2D2323", textDecoration: "none" }}
        >
          Explore the map
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="px-5 py-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Image src="/branding/logo-white.svg" alt="Uppy" width={60} height={18} style={{ filter: "brightness(10)", opacity: 0.3 }} />
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>Powered by Uppy</span>
        </div>
      </footer>
    </div>
  );
}
