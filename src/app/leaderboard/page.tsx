"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLeaderboard, type LeaderboardEntry } from "@/actions/proposals";
import PageHeader from "@/components/PageHeader";

function pad(n: number) { return String(n).padStart(2, "0"); }

const RANK_GLOW = [
  "0 0 20px rgba(255,216,102,0.4), 0 0 4px rgba(255,216,102,0.2)",
  "0 0 14px rgba(180,200,255,0.3), 0 0 4px rgba(180,200,255,0.15)",
  "0 0 14px rgba(221,168,130,0.3), 0 0 4px rgba(221,168,130,0.15)",
];
const RANK_COLOR = ["#ffd866", "#b4c8ff", "#dda882"];

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

      <div className="max-w-xl mx-auto px-2 sm:px-4 md:px-6 py-10">

        {/* ── SCREEN ── */}
        <div className="arcade-screen px-4 sm:px-6 md:px-8 py-8 sm:py-10">

          <div className="relative z-[3] text-center mb-2">
            <h1 className="arcade-font" style={{
              fontSize: "clamp(18px, 5vw, 32px)",
              color: "#ffd866",
              textShadow: "0 0 30px rgba(255,216,102,0.4), 0 0 60px rgba(255,216,102,0.15), 0 3px 0 #1a0a00",
              letterSpacing: "0.1em",
            }}>
              HIGH SCORES
            </h1>
          </div>

          <div className="relative z-[3] text-center mb-8 sm:mb-10">
            <p className="arcade-font arcade-pulse" style={{ fontSize: "clamp(5px, 1.2vw, 7px)", color: "rgba(255,216,102,0.2)", letterSpacing: "0.2em" }}>
              THRIFT MAP
            </p>
          </div>

          <div className="relative z-[3] flex justify-center gap-4 sm:gap-8 mb-8 sm:mb-10">
            <span className="arcade-font" style={{ fontSize: "clamp(6px, 1.4vw, 8px)", color: "rgba(255,216,102,0.35)" }}>
              +500 NEW STORE
            </span>
            <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>
            <span className="arcade-font" style={{ fontSize: "clamp(6px, 1.4vw, 8px)", color: "rgba(180,200,255,0.35)" }}>
              +300 EDIT
            </span>
          </div>

          <div className="relative z-[3] mx-4 mb-6" style={{ borderTop: "1px solid rgba(255,216,102,0.06)" }} />

          {loading && (
            <div className="relative z-[3] py-20 text-center">
              <span className="arcade-font arcade-blink" style={{ fontSize: "clamp(8px, 2vw, 11px)", color: "#ffd866" }}>
                LOADING
              </span>
            </div>
          )}

          {!loading && entries.length === 0 && (
            <div className="relative z-[3] py-16 text-center">
              <p className="arcade-font" style={{ fontSize: "clamp(10px, 2.5vw, 14px)", color: "#ffd866", lineHeight: 2 }}>
                NO SCORES YET
              </p>
              <p className="arcade-font mt-6" style={{ fontSize: "clamp(6px, 1.4vw, 8px)", color: "rgba(255,255,255,0.15)", lineHeight: 2.4 }}>
                PROPOSE A STORE<br />TO ENTER THE RANKINGS
              </p>
            </div>
          )}

          {!loading && entries.map((entry, i) => {
            const isTop3 = i < 3;
            const color = isTop3 ? RANK_COLOR[i] : "rgba(255,255,255,0.25)";
            const glow = isTop3 ? RANK_GLOW[i] : "none";
            const pts = entry.points * 100;
            const size = isTop3 ? "clamp(11px, 2.5vw, 16px)" : "clamp(9px, 2vw, 12px)";
            const nameSize = isTop3 ? "clamp(9px, 2vw, 12px)" : "clamp(8px, 1.6vw, 10px)";

            return (
              <div
                key={entry.user_id}
                className="arcade-row relative z-[3] flex items-baseline px-2 sm:px-4 py-2.5 sm:py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
              >
                <span className="arcade-font shrink-0" style={{ width: "clamp(28px, 8vw, 44px)", fontSize: size, color, textShadow: glow }}>
                  {pad(i + 1)}
                </span>
                <span className="arcade-font flex-1 truncate mx-2 sm:mx-3" style={{ fontSize: nameSize, color: isTop3 ? color : "rgba(255,255,255,0.2)", textShadow: isTop3 ? glow : "none" }}>
                  {(entry.username || "???").toUpperCase()}
                </span>
                <span className="arcade-font shrink-0 text-right" style={{ width: "clamp(48px, 14vw, 80px)", fontSize: size, color, textShadow: glow }}>
                  {pts.toLocaleString()}
                </span>
              </div>
            );
          })}

          {!loading && entries.length > 0 && (
            <div className="relative z-[3] mx-4 mt-6" style={{ borderTop: "1px solid rgba(255,216,102,0.06)" }} />
          )}

          <div className="relative z-[3] text-center mt-8 sm:mt-10">
            <p className="arcade-font arcade-blink" style={{ fontSize: "clamp(6px, 1.5vw, 9px)", color: "rgba(255,216,102,0.3)", letterSpacing: "0.1em" }}>
              INSERT COIN
            </p>
          </div>

          <div className="relative z-[3] text-center mt-8" style={{ borderTop: "1px dashed rgba(221,168,130,0.1)", paddingTop: "20px" }}>
            <p className="arcade-font arcade-pulse" style={{ fontSize: "clamp(6px, 1.4vw, 8px)", color: "rgba(221,168,130,0.35)", letterSpacing: "0.08em" }}>
              BONUS ROUND COMING SOON
            </p>
            <p className="mt-3" style={{ fontSize: "clamp(8px, 1.8vw, 10px)", color: "rgba(255,255,255,0.12)", lineHeight: 1.8 }}>
              Vintage prizes and marketplace coupons for top players
            </p>
          </div>

        </div>

        {/* Button */}
        <div className="text-center mt-8">
          <Link href="/" className="arcade-btn inline-block px-6 py-3" style={{ fontSize: "clamp(7px, 1.5vw, 9px)" }}>
            EXPLORE THE MAP
          </Link>
        </div>

        <p className="text-center mt-6 arcade-font" style={{ fontSize: "5px", color: "rgba(235,233,217,0.05)", letterSpacing: "0.3em" }}>
          CREDIT 00
        </p>
      </div>
    </div>
  );
}
