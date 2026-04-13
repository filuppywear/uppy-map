"use client";

import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

// Drop your images/svgs into public/market/ and list them here in order
const SLIDES: string[] = [
  // "/market/slide-1.svg",
  // "/market/slide-2.jpg",
];

interface Props {
  onClose: () => void;
}

export default function MarketCarousel({ onClose }: Props) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useBodyScrollLock(true);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (SLIDES.length <= 1) return;
      setIndex((i) => {
        const next = i + dir;
        if (next < 0) return SLIDES.length - 1;
        if (next >= SLIDES.length) return 0;
        return next;
      });
    },
    [],
  );

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, go]);

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };

  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const sx = touchStartX.current;
    const sy = touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (sx == null || sy == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    go(dx < 0 ? 1 : -1);
  };

  const hasMany = SLIDES.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(18,12,12,0.82)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full select-none"
        style={{ maxWidth: "min(900px, calc(100vw - 32px))" }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={hasMany ? onTouchStart : undefined}
        onTouchEnd={hasMany ? onTouchEnd : undefined}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 z-10 flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* 16:9 slide area */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: "16 / 9",
            background: "#2D2323",
          }}
        >
          {SLIDES.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                Coming soon
              </p>
            </div>
          ) : (
            <img
              key={index}
              src={SLIDES[index]}
              alt={`Slide ${index + 1}`}
              className="absolute inset-0 w-full h-full object-contain"
              draggable={false}
            />
          )}

          {/* Arrows */}
          {hasMany && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous slide"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center"
                style={{ background: "rgba(36,27,25,0.55)", color: "#fff", border: "none", cursor: "pointer" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next slide"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center"
                style={{ background: "rgba(36,27,25,0.55)", color: "#fff", border: "none", cursor: "pointer" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}

          {/* Counter */}
          {hasMany && (
            <div
              className="absolute top-3 right-3 px-3 py-1 text-[11px] font-bold"
              style={{ background: "rgba(36,27,25,0.56)", color: "#fff" }}
            >
              {index + 1} / {SLIDES.length}
            </div>
          )}
        </div>

        {/* Dots */}
        {hasMany && SLIDES.length <= 12 && (
          <div className="flex justify-center gap-2 mt-4">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: 10,
                  height: 10,
                  background: i === index ? "#fff" : "rgba(255,255,255,0.3)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "background 0.15s",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
