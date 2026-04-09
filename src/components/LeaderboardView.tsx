"use client";

import { useEffect, useState } from "react";
import { getLeaderboard, type LeaderboardEntry } from "@/actions/proposals";

const RANK_COLORS = ["#ffd866", "#c8d4ff", "#dda882"];
const RANK_CLASSES = ["arcade-row-gold", "arcade-row-silver", "arcade-row-bronze"];
const RANK_CSS = ["arcade-rank-1", "arcade-rank-2", "arcade-rank-3"];

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function LeaderboardView() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(setEntries)
      .catch((err) => console.error("Leaderboard load failed:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full overflow-y-auto arcade-cabinet">
      <div className="max-w-2xl mx-auto px-3 sm:px-6 md:px-8 py-8 pb-28 lg:pb-8">

        {/* ── CABINET TOP PLATE ── */}
        <div className="arcade-plate px-6 py-5 mb-6 text-center">
          <h1 className="arcade-font" style={{ fontSize: "clamp(16px, 4vw, 26px)", color: "#ffd866", letterSpacing: "0.08em", lineHeight: 1.6, textShadow: "0 0 20px rgba(255,216,102,0.3), 0 2px 0 #1a0e0e" }}>
            HIGH SCORES
          </h1>
          <div className="arcade-grille h-2 mt-3 mx-auto" style={{ maxWidth: "140px" }} />
        </div>

        {/* ── POWER-UPS ── */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mb-6">
          <div className="arcade-plate px-4 sm:px-5 py-2.5">
            <span className="arcade-font" style={{ fontSize: "clamp(6px, 1.5vw, 9px)", color: "#ffd866" }}>
              + NEW STORE = 500
            </span>
          </div>
          <div className="arcade-plate px-4 sm:px-5 py-2.5">
            <span className="arcade-font" style={{ fontSize: "clamp(6px, 1.5vw, 9px)", color: "#c8d4ff" }}>
              + EDIT = 300
            </span>
          </div>
        </div>

        {/* ── CRT SCREEN ── */}
        <div className="arcade-screen px-3 sm:px-5 md:px-7 py-6 sm:py-8">

          {/* Screen subtitle */}
          <div className="relative z-[3] text-center mb-6 sm:mb-8">
            <p className="arcade-font arcade-pulse" style={{ fontSize: "clamp(5px, 1.3vw, 8px)", color: "rgba(255,216,102,0.25)", letterSpacing: "0.15em" }}>
              — THE WORLD&apos;S THRIFT MAP —
            </p>
          </div>

          {/* Header row */}
          <div className="relative z-[3] hidden md:flex items-center px-3 pb-3 mb-3" style={{ borderBottom: "1px solid rgba(255,216,102,0.08)" }}>
            <span className="arcade-font w-14" style={{ fontSize: "7px", color: "rgba(255,216,102,0.18)" }}>RANK</span>
            <span className="arcade-font flex-1" style={{ fontSize: "7px", color: "rgba(255,216,102,0.18)" }}>PLAYER</span>
            <span className="arcade-font w-24 text-right" style={{ fontSize: "7px", color: "rgba(255,216,102,0.18)" }}>SCORE</span>
            <span className="arcade-font w-16 text-right" style={{ fontSize: "7px", color: "rgba(255,216,102,0.18)" }}>LVL</span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="relative z-[3] py-20 text-center">
              <span className="arcade-font arcade-blink" style={{ fontSize: "clamp(7px, 1.8vw, 10px)", color: "#ffd866" }}>
                LOADING . . .
              </span>
            </div>
          )}

          {/* Empty */}
          {!loading && entries.length === 0 && (
            <div className="relative z-[3] py-20 text-center">
              <p className="arcade-font" style={{ fontSize: "clamp(8px, 2vw, 12px)", color: "#ffd866", lineHeight: 2.2 }}>
                NO SCORES YET
              </p>
              <p className="arcade-font mt-4" style={{ fontSize: "clamp(5px, 1.2vw, 7px)", color: "rgba(235,233,217,0.2)", lineHeight: 2 }}>
                PROPOSE A STORE TO<br />ENTER THE RANKINGS
              </p>
            </div>
          )}

          {/* Scores */}
          {!loading && entries.map((entry, i) => {
            const color = i < 3 ? RANK_COLORS[i] : "rgba(235,233,217,0.3)";
            const rowClass = i < 3 ? RANK_CLASSES[i] : "";
            const rankCss = i < 3 ? RANK_CSS[i] : "";
            const pts = entry.points * 100;

            return (
              <div
                key={entry.user_id}
                className={`arcade-row ${rowClass} relative z-[3] flex items-center px-2 sm:px-3 py-3 sm:py-3.5`}
                style={{ borderBottom: "1px solid rgba(235,233,217,0.04)" }}
              >
                {/* Rank */}
                <span className={`arcade-font w-9 sm:w-12 md:w-14 shrink-0 ${rankCss}`} style={{ fontSize: "clamp(10px, 2.2vw, 14px)", color: i >= 3 ? "rgba(235,233,217,0.2)" : undefined }}>
                  {pad(i + 1)}
                </span>

                {/* Dot separator */}
                <span className="shrink-0 mx-1 sm:mx-2" style={{ color: "rgba(235,233,217,0.1)", fontSize: "10px" }}>.</span>

                {/* Name */}
                <span
                  className="arcade-font flex-1 truncate"
                  style={{ fontSize: "clamp(8px, 1.8vw, 11px)", color, letterSpacing: "0.03em" }}
                >
                  {(entry.username || "???").toUpperCase()}
                </span>

                {/* Score */}
                <span className={`arcade-font w-16 sm:w-20 md:w-24 text-right shrink-0 ${rankCss}`} style={{ fontSize: "clamp(10px, 2.2vw, 14px)", color: i >= 3 ? "rgba(235,233,217,0.25)" : undefined }}>
                  {pts.toLocaleString()}
                </span>

                {/* Approved count */}
                <span className="hidden md:block arcade-font w-16 text-right shrink-0" style={{ fontSize: "clamp(7px, 1.5vw, 9px)", color: "rgba(235,233,217,0.12)" }}>
                  {entry.approved_count}
                </span>
              </div>
            );
          })}

          {/* Bottom blink */}
          <div className="relative z-[3] text-center mt-10">
            <p className="arcade-font arcade-blink" style={{ fontSize: "clamp(5px, 1.3vw, 8px)", color: "rgba(255,216,102,0.25)", letterSpacing: "0.06em" }}>
              INSERT COIN
            </p>
            <p className="arcade-font mt-2" style={{ fontSize: "clamp(4px, 1vw, 6px)", color: "rgba(235,233,217,0.12)", letterSpacing: "0.04em" }}>
              PROPOSE STORES TO RANK UP
            </p>
          </div>
        </div>

        {/* ── BONUS PLATE ── */}
        <div className="arcade-plate mt-6 px-5 py-4 text-center">
          <span className="arcade-font arcade-pulse" style={{ fontSize: "clamp(6px, 1.4vw, 8px)", color: "#dda882", letterSpacing: "0.06em", textShadow: "0 0 12px rgba(221,168,130,0.2)" }}>
            ★ BONUS ROUND ★
          </span>
          <p className="arcade-font mt-3" style={{ fontSize: "clamp(4px, 1vw, 6px)", color: "rgba(235,233,217,0.2)", lineHeight: 2.2 }}>
            VINTAGE PRIZES &amp; COUPONS<br />COMING SOON
          </p>
        </div>

        {/* ── SPEAKER GRILLE ── */}
        <div className="arcade-grille h-4 mt-6 mx-auto" style={{ maxWidth: "220px" }} />
        <p className="text-center mt-4 arcade-font" style={{ fontSize: "6px", color: "rgba(235,233,217,0.06)", letterSpacing: "0.3em" }}>
          CREDIT 00
        </p>
      </div>
    </div>
  );
}
