"use client";

import { useEffect, useState } from "react";
import { getLeaderboard, type LeaderboardEntry } from "@/actions/proposals";

export default function LeaderboardView() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then((data) => setEntries(data))
      .catch((err) => console.error("Leaderboard load failed:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#302020" }}>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 pb-28 lg:pb-10">
        <div className="text-center mb-8">
          <h1 className="font-bold uppercase" style={{ fontSize: "16px", letterSpacing: "0.12em", color: "#fff" }}>
            Leaderboard
          </h1>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>
            Top contributors to the world&apos;s thrift map
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-8">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize: "12px", color: "#fff" }}><strong>5 pts</strong></span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>new store</span>
          </div>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize: "12px", color: "#fff" }}><strong>3 pts</strong></span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>edit / removal</span>
          </div>
        </div>

        <div className="mb-8 px-5 py-4 flex items-start gap-3" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A58277" strokeWidth="1.5"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
          <div>
            <span className="font-bold uppercase" style={{ fontSize: "10px", letterSpacing: "0.15em", color: "#A58277" }}>Rewards coming soon</span>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", lineHeight: "1.6", marginTop: "4px" }}>
              Vintage prizes, 100% marketplace coupons, and exclusive perks for top contributors.
            </p>
          </div>
        </div>

        <div style={{ background: "#fff" }}>
          <div className="hidden md:flex items-center px-6 py-3" style={{ borderBottom: "2px solid rgba(36,27,25,0.06)" }}>
            <span className="w-12 font-bold uppercase" style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#A58277" }}>#</span>
            <span className="flex-1 font-bold uppercase" style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#A58277" }}>Contributor</span>
            <span className="w-20 text-right font-bold uppercase" style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#A58277" }}>Points</span>
            <span className="w-24 text-right font-bold uppercase" style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#A58277" }}>Approved</span>
          </div>

          {loading && (
            <div className="px-6 py-10 text-center" style={{ color: "rgba(36,27,25,0.35)" }}>
              Loading leaderboard...
            </div>
          )}

          {!loading && entries.length === 0 && (
            <div className="px-6 py-10 text-center" style={{ color: "rgba(36,27,25,0.45)" }}>
              No approved contributions yet.
            </div>
          )}

          {!loading && entries.map((entry, i) => (
            <div
              key={entry.user_id}
              className="flex items-center px-4 md:px-6 py-3.5 md:py-4 transition-colors hover:bg-[rgba(97,68,57,0.06)]"
              style={{
                borderBottom: "1px solid rgba(36,27,25,0.06)",
                background: i < 3 ? "rgba(97,68,57,0.04)" : "#fff",
              }}
            >
              <span className="w-8 md:w-12 shrink-0 font-bold" style={{ fontSize: "14px", color: i < 3 ? "#614439" : "rgba(36,27,25,0.25)" }}>
                {`#${i + 1}`}
              </span>
              <div className="flex-1 flex items-center gap-2 md:gap-3 min-w-0">
                <div className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center shrink-0" style={{ background: i < 3 ? "#614439" : "rgba(36,27,25,0.05)", borderRadius: "50%" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={i < 3 ? "#fff" : "rgba(36,27,25,0.2)"} strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
                <span className="truncate" style={{ fontSize: "13px", fontWeight: i < 3 ? 700 : 500, color: "#302020" }}>
                  {entry.username || "Anonymous"}
                </span>
              </div>
              <span className="w-14 md:w-20 text-right font-bold shrink-0" style={{ fontSize: "15px", color: "#614439" }}>
                {entry.points}
              </span>
              <span className="hidden md:flex w-24 text-right items-center justify-end gap-1.5" style={{ fontSize: "12px", color: "rgba(36,27,25,0.35)" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                {entry.approved_count}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>Propose stores to climb the leaderboard</p>
        </div>
      </div>
    </div>
  );
}
