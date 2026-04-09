"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLeaderboard, type LeaderboardEntry } from "@/actions/proposals";
import PageHeader from "@/components/PageHeader";

const RANK_COLORS = [
  "#EBE9D9",
  "rgba(255,255,255,0.65)",
  "#A58277",
];

function padRank(n: number) {
  return String(n).padStart(2, "0");
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then((data) => setEntries(data))
      .catch((err) => console.error("Leaderboard load failed:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#302020" }}>
      <PageHeader activePage="leaderboard" />

      {/* Scanlines overlay */}
      <div className="arcade-scanlines fixed inset-0 z-[1]" />

      <div className="relative z-[2] max-w-2xl mx-auto px-4 md:px-8 py-12">

        {/* ── TITLE ── */}
        <div className="text-center mb-10">
          <h1
            className="arcade-font"
            style={{ fontSize: "clamp(14px, 3.5vw, 22px)", color: "#EBE9D9", letterSpacing: "0.05em", lineHeight: 1.6 }}
          >
            HIGH SCORES
          </h1>
          <p
            className="arcade-font arcade-pulse mt-3"
            style={{ fontSize: "clamp(6px, 1.5vw, 8px)", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}
          >
            THE WORLD&apos;S THRIFT MAP
          </p>
        </div>

        {/* ── POWER-UPS ── */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mb-10">
          <div className="px-4 py-2.5" style={{ border: "2px dashed rgba(235,233,217,0.2)" }}>
            <span className="arcade-font" style={{ fontSize: "8px", color: "#EBE9D9" }}>
              ★ NEW STORE = 500 PTS
            </span>
          </div>
          <div className="px-4 py-2.5" style={{ border: "2px dashed rgba(235,233,217,0.2)" }}>
            <span className="arcade-font" style={{ fontSize: "8px", color: "#EBE9D9" }}>
              ✎ EDIT = 300 PTS
            </span>
          </div>
        </div>

        {/* ── BONUS ROUND ── */}
        <div className="mb-10 px-5 py-4 text-center" style={{ border: "2px dashed rgba(165,130,119,0.35)" }}>
          <span className="arcade-font arcade-pulse" style={{ fontSize: "8px", color: "#A58277", letterSpacing: "0.08em" }}>
            ★ BONUS ROUND — COMING SOON ★
          </span>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "8px", lineHeight: 1.6 }}>
            Vintage prizes, marketplace coupons, and exclusive perks for top players.
          </p>
        </div>

        {/* ── HEADER ROW ── */}
        <div className="hidden md:flex items-center px-4 py-2 mb-1" style={{ borderBottom: "2px solid rgba(235,233,217,0.12)" }}>
          <span className="arcade-font w-14" style={{ fontSize: "7px", color: "rgba(255,255,255,0.25)" }}>RANK</span>
          <span className="arcade-font flex-1" style={{ fontSize: "7px", color: "rgba(255,255,255,0.25)" }}>NAME</span>
          <span className="arcade-font w-28 text-right" style={{ fontSize: "7px", color: "rgba(255,255,255,0.25)" }}>SCORE</span>
        </div>

        {/* ── SCORES ── */}
        {loading && (
          <div className="py-16 text-center">
            <span className="arcade-font arcade-blink" style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)" }}>
              LOADING...
            </span>
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="py-16 text-center">
            <span className="arcade-font" style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)" }}>
              NO SCORES YET
            </span>
          </div>
        )}

        {!loading && entries.map((entry, i) => {
          const color = i < 3 ? RANK_COLORS[i] : "rgba(255,255,255,0.35)";
          const displayPoints = entry.points * 100;

          return (
            <div
              key={entry.user_id}
              className="arcade-row flex items-center px-4 py-3 md:py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              <span className="arcade-font w-10 md:w-14 shrink-0" style={{ fontSize: "clamp(9px, 2vw, 12px)", color }}>
                {padRank(i + 1)}
              </span>
              <span
                className="flex-1 truncate"
                style={{ fontSize: "clamp(11px, 2.5vw, 14px)", fontWeight: i < 3 ? 700 : 400, color, letterSpacing: "0.04em", textTransform: "uppercase" }}
              >
                {entry.username || "???"}
              </span>
              <span className="arcade-font w-20 md:w-28 text-right shrink-0" style={{ fontSize: "clamp(9px, 2vw, 12px)", color }}>
                {displayPoints.toLocaleString()}
              </span>
            </div>
          );
        })}

        {/* ── FOOTER ── */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="arcade-font inline-block px-6 py-3"
            style={{ fontSize: "8px", color: "#EBE9D9", border: "2px dashed rgba(235,233,217,0.25)", textDecoration: "none", letterSpacing: "0.05em" }}
          >
            EXPLORE THE MAP
          </Link>
          <p
            className="arcade-font arcade-blink mt-8"
            style={{ fontSize: "clamp(6px, 1.5vw, 8px)", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}
          >
            INSERT COIN — PROPOSE STORES TO RANK UP
          </p>
          <p className="mt-6" style={{ fontSize: "9px", color: "rgba(255,255,255,0.1)", letterSpacing: "0.2em" }}>
            CREDIT 00
          </p>
        </div>
      </div>
    </div>
  );
}
