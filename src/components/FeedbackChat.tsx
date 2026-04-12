"use client";

import { useState, useRef, useEffect } from "react";
import { submitFeedback } from "@/actions/feedback";
import { useAuth } from "@/hooks/useAuth";

type Category = "bug" | "idea" | "praise" | "other";
type Phase = "closed" | "open" | "sent";

interface Message {
  from: "bot" | "user";
  text: string;
}

const INTRO: Message[] = [
  { from: "bot", text: "Hey! Thanks for trying Üppy while it's in beta." },
  { from: "bot", text: "What kind of feedback do you have?" },
];

const THANKS_AUTH = "Thanks! If the team finds it useful, you'll earn +1 point on the leaderboard.";
const THANKS_ANON = "Thanks! Your feedback is on its way to the team.";

export default function FeedbackChat() {
  const { isLoggedIn } = useAuth();
  const [phase, setPhase] = useState<Phase>("closed");
  const [messages, setMessages] = useState<Message[]>(INTRO);
  const [category, setCategory] = useState<Category | null>(null);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, phase]);

  // Focus input when user picks a category
  useEffect(() => {
    if (category && inputRef.current) inputRef.current.focus();
  }, [category]);

  // Lock body scroll while chat is open
  useEffect(() => {
    if (phase === "closed") return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [phase]);

  // Escape to close
  useEffect(() => {
    if (phase === "closed") return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  function open() {
    setPhase("open");
  }

  function close() {
    setPhase("closed");
    // Reset after animation
    setTimeout(() => {
      setMessages(INTRO);
      setCategory(null);
      setInput("");
      setError(null);
    }, 300);
  }

  function pickCategory(cat: Category, label: string) {
    setCategory(cat);
    setMessages((m) => [
      ...m,
      { from: "user", text: label },
      { from: "bot", text: "Tell me more — the more specific, the better!" },
    ]);
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || submitting) return;
    setError(null);
    setSubmitting(true);

    const userMsg: Message = { from: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    const result = await submitFeedback({
      message: trimmed,
      category: category ?? "other",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });

    setSubmitting(false);

    if ("error" in result && result.error) {
      setError(result.error);
      setMessages((m) => [...m, { from: "bot", text: `Hmm, something went wrong: ${result.error}. Try again?` }]);
      return;
    }

    setMessages((m) => [
      ...m,
      { from: "bot", text: isLoggedIn ? THANKS_AUTH : THANKS_ANON },
    ]);
    setPhase("sent");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* ── Floating button ── */}
      {phase === "closed" && (
        <button
          type="button"
          onClick={open}
          aria-label="Send feedback"
          className="fixed z-[55] flex items-center gap-2 px-4 py-3 shadow-lg transition-transform active:scale-95"
          style={{
            right: "calc(1rem + var(--sai-right, 0px))",
            bottom: "calc(5.5rem + var(--sai-bottom, 0px))",
            background: "#2D2323",
            color: "#EBE9D9",
            border: "1.5px solid rgba(235,233,217,0.25)",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "Inter, sans-serif",
            boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Feedback
        </button>
      )}

      {/* ── Chat panel ── */}
      {phase !== "closed" && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          onClick={close}
        >
          <div
            className="relative w-full sm:max-w-sm flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#2D2323",
              height: "min(85vh, 640px)",
              maxHeight: "calc(100dvh - var(--sai-top, 0px))",
              boxShadow: "0 28px 80px rgba(0,0,0,0.45)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingTop: "calc(1rem + var(--sai-top, 0px))" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center" style={{ width: 32, height: 32, background: "#EBE9D9", color: "#2D2323", borderRadius: "50%", fontWeight: 900, fontSize: 14, fontFamily: "var(--font-display)" }}>Ü</div>
                <div>
                  <div className="text-[12px] font-bold uppercase" style={{ letterSpacing: "0.1em", color: "#EBE9D9" }}>Beta feedback</div>
                  <div className="text-[10px]" style={{ color: "rgba(235,233,217,0.5)" }}>We read every message</div>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close feedback"
                className="flex items-center justify-center"
                style={{ width: 40, height: 40, background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5" style={{ overscrollBehavior: "contain" }}>
              <div className="flex flex-col gap-2.5">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className="max-w-[85%] px-4 py-2.5 animate-[fade-in_0.2s_ease-out]"
                    style={{
                      alignSelf: m.from === "bot" ? "flex-start" : "flex-end",
                      background: m.from === "bot" ? "rgba(235,233,217,0.08)" : "#EBE9D9",
                      color: m.from === "bot" ? "#EBE9D9" : "#2D2323",
                      borderRadius: m.from === "bot" ? "14px 14px 14px 2px" : "14px 14px 2px 14px",
                      fontSize: "13px",
                      lineHeight: 1.5,
                      wordBreak: "break-word",
                    }}
                  >
                    {m.text}
                  </div>
                ))}

                {/* Category chips — shown after intro, before selection */}
                {!category && phase === "open" && (
                  <div className="flex flex-wrap gap-2 mt-2" style={{ alignSelf: "flex-start" }}>
                    {[
                      { key: "bug" as const, label: "Bug report" },
                      { key: "idea" as const, label: "Feature idea" },
                      { key: "praise" as const, label: "Praise" },
                      { key: "other" as const, label: "Something else" },
                    ].map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => pickCategory(c.key, c.label)}
                        className="px-3 py-2 transition-colors"
                        style={{
                          background: "transparent",
                          color: "#EBE9D9",
                          border: "1px solid rgba(235,233,217,0.3)",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 600,
                          letterSpacing: "0.03em",
                          cursor: "pointer",
                          minHeight: 36,
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Composer */}
            {phase === "open" && category && (
              <div
                className="px-4 py-3 shrink-0"
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  paddingBottom: "calc(0.75rem + var(--sai-bottom, 0px))",
                }}
              >
                {error && (
                  <p className="mb-2 text-[11px]" style={{ color: "#ff8b7b" }}>{error}</p>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={1}
                    disabled={submitting}
                    className="flex-1 resize-none outline-none"
                    style={{
                      background: "rgba(235,233,217,0.06)",
                      color: "#EBE9D9",
                      border: "1px solid rgba(235,233,217,0.15)",
                      padding: "10px 12px",
                      fontSize: "16px", // 16px prevents iOS zoom
                      lineHeight: 1.4,
                      minHeight: 42,
                      maxHeight: 120,
                      fontFamily: "Inter, sans-serif",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={submitting || !input.trim()}
                    aria-label="Send"
                    className="flex items-center justify-center shrink-0 transition-opacity"
                    style={{
                      width: 42,
                      height: 42,
                      background: "#EBE9D9",
                      color: "#2D2323",
                      border: "none",
                      cursor: submitting || !input.trim() ? "not-allowed" : "pointer",
                      opacity: submitting || !input.trim() ? 0.4 : 1,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-[10px]" style={{ color: "rgba(235,233,217,0.35)" }}>
                  {isLoggedIn ? "Quality feedback earns +1 leaderboard point" : "Sign in to earn leaderboard points"}
                </p>
              </div>
            )}

            {/* Sent state */}
            {phase === "sent" && (
              <div className="px-4 py-4 shrink-0 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingBottom: "calc(1rem + var(--sai-bottom, 0px))" }}>
                <button
                  type="button"
                  onClick={() => { setMessages(INTRO); setCategory(null); setInput(""); setPhase("open"); }}
                  className="flex-1 py-3 text-[11px] font-bold uppercase tracking-[0.08em]"
                  style={{ background: "transparent", color: "#EBE9D9", border: "1px solid rgba(235,233,217,0.25)", cursor: "pointer" }}
                >
                  Send another
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="flex-1 py-3 text-[11px] font-bold uppercase tracking-[0.08em]"
                  style={{ background: "#EBE9D9", color: "#2D2323", border: "none", cursor: "pointer" }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
