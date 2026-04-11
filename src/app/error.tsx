"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 p-6" style={{ background: "#2D2323" }}>
      <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Something went wrong</h1>
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>An unexpected error occurred.</p>
      <button onClick={reset} className="text-sm font-bold uppercase tracking-[0.16em] px-6 py-3 mt-2" style={{ background: "#fff", color: "#2D2323", border: "none", cursor: "pointer" }}>
        Try again
      </button>
    </div>
  );
}
