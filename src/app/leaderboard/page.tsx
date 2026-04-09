"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLeaderboard, type LeaderboardEntry } from "@/actions/proposals";
import PageHeader from "@/components/PageHeader";

const RANK_COLORS = ["#EBE9D9", "rgba(255,255,255,0.6)", "#A58277"];
const RANK_CLASSES = ["arcade-row-gold", "arcade-row-silver", "arcade-row-bronze"];

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(setEntries)
      .catch((err) => console.error("Leaderboard load failed:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen arcade-cabinet">
      <PageHeader activePage="leaderboard" />

      <div className="max-w-2xl mx-auto px-3 sm:px-6 md:px-8 py-10">

        {/* ── CABINET TOP PLATE ── */}
        <div className="arcade-plate px-6 py-4 mb-6 text-center">
          <h1 className="arcade-font" style={{ fontSize: "clamp(12px, 3vw, 20px)", color: "#EBE9D9", letterSpacing: "0.06em", lineHeight: 1.8 }}>
            HIGH SCORES
          </h1>
          <div className="arcade-grille h-2 mt-2 mx-auto" style={{ maxWidth: "120px" }} />
        </div>

        {/* ── POWER-UP PLATES ── */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-5">
          <div className="arcade-plate px-3 sm:px-4 py-2">
            <span className="arcade-font" style={{ fontSize: "clamp(5px, 1.3vw, 7px)", color: "#EBE9D9", letterSpacing: "0.04em" }}>
              ★ NEW STORE 500 PTS
            </span>
          </div>
          <div className="arcade-plate px-3 sm:px-4 py-2">
            <span className="arcade-font" style={{ fontSize: "clamp(5px, 1.3vw, 7px)", color: "#EBE9D9", letterSpacing: "0.04em" }}>
              ✎ EDIT 300 PTS
            </span>
          </div>
        </div>

        {/* ── CRT SCREEN ── */}
        <div className="arcade-screen px-3 sm:px-5 md:px-6 py-6 sm:py-8">

          <div className="relative z-[3] text-center mb-6">
            <p className="arcade-font arcade-pulse" style={{ fontSize: "clamp(5px, 1.2vw, 7px)", color: "rgba(235,233,217,0.3)", letterSpacing: "0.12em" }}>
              THE WORLD&apos;S THRIFT MAP
            </p>
          </div>

          <div className="relative z-[3] hidden md:flex items-center px-3 pb-3 mb-2" style={{ borderBottom: "1px solid rgba(235,233,217,0.08)" }}>
            <span className="arcade-font w-14" style={{ fontSize: "6px", color: "rgba(235,233,217,0.2)" }}>RANK</span>
            <span className="arcade-font flex-1" style={{ fontSize: "6px", color: "rgba(235,233,217,0.2)" }}>PLAYER</span>
            <span className="arcade-font w-24 text-right" style={{ fontSize: "6px", color: "rgba(235,233,217,0.2)" }}>SCORE</span>
            <span className="arcade-font w-16 text-right" style={{ fontSize: "6px", color: "rgba(235,233,217,0.2)" }}>✓</span>
          </div>

          {loading && (
            <div className="relative z-[3] py-16 text-center">
              <span className="arcade-font arcade-blink" style={{ fontSize: "clamp(6px, 1.5vw, 8px)", color: "rgba(235,233,217,0.35)" }}>
                LOADING . . .
              </span>
            </div>
          )}

          {!loading && entries.length === 0 && (
            <div className="relative z-[3] py-16 text-center">
              <span className="arcade-font" style={{ fontSize: "clamp(6px, 1.5vw, 8px)", color: "rgba(235,233,217,0.25)" }}>
                NO SCORES YET
              </span>
              <p className="mt-4" style={{ fontSize: "10px", color: "rgba(235,233,217,0.15)" }}>
                Be the first — propose a store to earn points
              </p>
            </div>
          )}

          {!loading && entries.map((entry, i) => {
            const color = i < 3 ? RANK_COLORS[i] : "rgba(235,233,217,0.3)";
            const rowClass = i < 3 ? RANK_CLASSES[i] : "";
            const pts = entry.points * 100;

            return (
              <div
                key={entry.user_id}
                className={`arcade-row ${rowClass} relative z-[3] flex items-center px-2 sm:px-3 py-2.5 sm:py-3`}
                style={{ borderBottom: "1px solid rgba(235,233,217,0.03)" }}
              >
                <span className="arcade-font w-8 sm:w-10 md:w-14 shrink-0" style={{ fontSize: "clamp(8px, 1.8vw, 11px)", color }}>
                  {pad(i + 1)}
                </span>
                <span
                  className="flex-1 truncate"
                  style={{ fontSize: "clamp(10px, 2.2vw, 13px)", fontWeight: i < 3 ? 700 : 400, color, letterSpacing: "0.04em", textTransform: "uppercase" }}
                >
                  {entry.username || "???"}
                </span>
                <span className="arcade-font w-16 sm:w-20 md:w-24 text-right shrink-0" style={{ fontSize: "clamp(8px, 1.8vw, 11px)", color }}>
                  {pts.toLocaleString()}
                </span>
                <span className="hidden md:block arcade-font w-16 text-right shrink-0" style={{ fontSize: "clamp(7px, 1.5vw, 9px)", color: "rgba(235,233,217,0.15)" }}>
                  {entry.approved_count}
                </span>
              </div>
            );
          })}

          <div className="relative z-[3] text-center mt-8">
            <p className="arcade-font arcade-blink" style={{ fontSize: "clamp(5px, 1.2vw, 7px)", color: "rgba(235,233,217,0.2)", letterSpacing: "0.04em" }}>
              INSERT COIN — PROPOSE STORES TO RANK UP
            </p>
          </div>
        </div>

        {/* ── BONUS PLATE ── */}
        <div className="arcade-plate mt-5 px-5 py-4 text-center">
          <span className="arcade-font arcade-pulse" style={{ fontSize: "clamp(5px, 1.2vw, 7px)", color: "#A58277", letterSpacing: "0.06em" }}>
            ★ BONUS ROUND — COMING SOON ★
          </span>
          <p className="mt-2" style={{ fontSize: "9px", color: "rgba(235,233,217,0.25)", lineHeight: 1.7 }}>
            Vintage prizes, marketplace coupons, exclusive perks
          </p>
        </div>

        {/* ── MAP BUTTON ── */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="arcade-font inline-block px-5 py-3 arcade-plate"
            style={{ fontSize: "clamp(6px, 1.3vw, 8px)", color: "#EBE9D9", textDecoration: "none", letterSpacing: "0.05em" }}
          >
            EXPLORE THE MAP
          </Link>
        </div>

        {/* ── CABINET FOOTER ── */}
        <div className="arcade-grille h-3 mt-8 mx-auto" style={{ maxWidth: "200px" }} />
        <p className="text-center mt-4" style={{ fontSize: "8px", color: "rgba(235,233,217,0.08)", letterSpacing: "0.25em" }}>
          CREDIT 00
        </p>
      </div>
    </div>
  );
}
