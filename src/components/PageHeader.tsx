"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  activePage?: "map" | "leaderboard";
}

export default function PageHeader({ activePage }: Props) {
  const { isLoggedIn } = useAuth();

  const linkStyle = (active: boolean) => ({
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    fontFamily: "Inter, sans-serif",
    color: active ? "#fff" : "rgba(255,255,255,0.5)",
    textDecoration: active ? "underline" : "none" as const,
    textUnderlineOffset: "4px",
    textDecorationThickness: "1px",
  });

  return (
    <div className="sticky top-0 z-30" style={{ background: "#2D2323" }}>
      <div className="hidden lg:flex items-center h-12 px-4 md:px-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <nav className="flex items-center gap-5">
          <Link href="/?market=1" className="header-btn font-bold uppercase flex items-center gap-1.5" style={{ ...linkStyle(false), color: "rgba(255,255,255,0.5)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            Market
          </Link>
          <Link href="/" className="header-btn font-bold uppercase" style={linkStyle(activePage === "map")}>Map</Link>
          <Link href="/leaderboard" className="header-btn font-bold uppercase" style={linkStyle(activePage === "leaderboard")}>Leaderboard</Link>
        </nav>

        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2">
          <Link href="/" className="pointer-events-auto block">
            <Image src="/branding/logo-white.svg" alt="Uppy" width={94} height={28} className="h-7 w-auto object-contain" style={{ filter: "brightness(10)" }} />
          </Link>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          <Link href={isLoggedIn ? "/favorites" : "/"} className="header-btn p-2 text-white" title="Favorites">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
          </Link>
          <Link href="/" className="header-btn p-2 text-white" title="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </Link>
          <Link href={isLoggedIn ? "/profile" : "/"} className="header-btn p-2 text-white" title={isLoggedIn ? "Profile" : "Sign in"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </Link>
        </div>
      </div>

      <div className="lg:hidden">
        <div className="relative flex items-center justify-center px-3 h-14">
          <Link href="/">
            <Image src="/branding/logo-white.svg" alt="Uppy" width={44} height={14} style={{ filter: "brightness(10)" }} />
          </Link>
          <div className="absolute right-2 flex items-center">
            <Link href={isLoggedIn ? "/favorites" : "/"} className="header-btn p-2.5 text-white min-w-[44px] min-h-[44px] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            </Link>
            <Link href={isLoggedIn ? "/profile" : "/"} className="header-btn p-2.5 text-white min-w-[44px] min-h-[44px] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
