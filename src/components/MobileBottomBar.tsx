"use client";

import { Globe, Trophy, User } from "lucide-react";

export type BottomTab = "map" | "leaderboard" | "profile";

interface Props {
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
}

const tabs: { key: BottomTab; icon: typeof Globe; label: string }[] = [
  { key: "map", icon: Globe, label: "Map" },
  { key: "leaderboard", icon: Trophy, label: "Board" },
  { key: "profile", icon: User, label: "Profile" },
];

export default function MobileBottomBar({ activeTab, onTabChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[var(--surface-deep)] pb-[calc(env(safe-area-inset-bottom,0px)+0.35rem)] shadow-[0_-10px_30px_rgba(0,0,0,0.18)]">
      {/* Active indicator line */}
      <div className="relative h-[2px]" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="absolute top-0 h-full transition-all duration-300 ease-out"
          style={{
            width: `${100 / tabs.length}%`,
            left: `${(tabs.findIndex(t => t.key === activeTab) * 100) / tabs.length}%`,
            background: "var(--tertiary)",
          }}
        />
      </div>
      <div className="grid h-[4.25rem] grid-cols-3 items-end px-3 pt-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className="flex h-full flex-col items-center justify-center gap-1 px-1 pb-2 transition-all duration-200"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: isActive ? "#fff" : "rgba(255,255,255,0.4)",
              }}
            >
              <Icon
                className="h-[1.25rem] w-[1.25rem] transition-transform duration-200"
                strokeWidth={isActive ? 2.2 : 1.6}
                style={{ transform: isActive ? "translateY(-1px)" : "none" }}
              />
              <span
                className="font-bold uppercase"
                style={{
                  fontSize: "9px",
                  letterSpacing: "var(--tracking-label)",
                  color: isActive ? "var(--tertiary)" : "rgba(255,255,255,0.3)",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
