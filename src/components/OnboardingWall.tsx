"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { SocialButton } from "./WaitlistPopup";
import { createSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase-browser";
import { isValidEmail, normalizeEmail, persistWaitlistSession, type WaitlistProvider } from "@/lib/waitlist";
import { track } from "@/lib/analytics";
import { DEFAULT_STATS, type DatasetStats } from "@/lib/types";
import { AnimatedNumber } from "./AnimatedNumber";

interface Props {
  onComplete: () => void;
  stats?: DatasetStats;
}
type Step = 1 | 2 | 3;
type SocialProvider = "google";

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => i + 1).map((i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-white" : i < current ? "w-1.5 bg-white" : "w-1.5 bg-white/20"}`} />
      ))}
    </div>
  );
}

export default function OnboardingWall({ onComplete, stats = DEFAULT_STATS }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [oauthLoading, setOauthLoading] = useState<SocialProvider | null>(null);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const completionRef = useRef(false);
  const authConfigured = hasSupabaseBrowserConfig();
  const rememberMeRef = useRef(rememberMe);

  useEffect(() => {
    rememberMeRef.current = rememberMe;
  }, [rememberMe]);

  // Don't block body overflow — let the map render behind the wall

  const next = useCallback(() => { setDir("fwd"); setStep(s => Math.min(s + 1, 3) as Step); }, []);
  const back = useCallback(() => { setDir("back"); setStep(s => Math.max(s - 1, 1) as Step); }, []);

  const completeAccess = useCallback(async (nextEmail: string, provider: WaitlistProvider) => {
    if (completionRef.current) return;
    completionRef.current = true;
    const normalized = normalizeEmail(nextEmail);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalized,
          role: "buyer",
          source: "map_onboarding_wall",
          origin: "map_onboarding",
          provider,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || `Waitlist API error: ${res.status}`);
      }
    } catch (err) {
      completionRef.current = false;
      setError(err instanceof Error ? err.message : "Could not unlock the map right now.");
      return;
    }
    persistWaitlistSession({
      email: normalized,
      joinedAt: new Date().toISOString(),
      origin: "map_onboarding_wall",
      remembered: rememberMeRef.current,
      role: "customer",
      provider,
    });
    track("onboarding_completed", { provider });
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!authConfigured) return;
    const supabase = createSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email) {
        void completeAccess(session.user.email, (session.user.app_metadata?.provider as WaitlistProvider) ?? "email");
      }
    });
    return () => { subscription.unsubscribe(); };
  }, [authConfigured, completeAccess]);

  const handleOAuth = useCallback(async (provider: SocialProvider) => {
    if (!authConfigured) { setError("OAuth not configured yet. Use email instead."); return; }
    setError(""); setOauthLoading(provider);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: e } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.href } });
      if (e) { setOauthLoading(null); setError(e.message); }
    } catch (e) { setOauthLoading(null); setError(e instanceof Error ? e.message : "Sign-in failed"); }
  }, [authConfigured]);

  const handleEmail = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) { setError("Please enter a valid email."); return; }
    setError(""); setEmailSubmitting(true);

    if (authConfigured) {
      // Send OTP code via Supabase (no magic link, just 6-digit code)
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: normalizeEmail(email),
          options: { shouldCreateUser: true },
        });
        if (otpError) { setEmailSubmitting(false); setError(otpError.message); return; }
        setEmailSubmitting(false);
        setEmailSent(true);
      } catch (err) {
        setEmailSubmitting(false);
        setError(err instanceof Error ? err.message : "Failed to send code");
      }
    } else {
      // Fallback: direct access when Supabase not configured
      await completeAccess(email, "email");
    }
  }, [email, completeAccess, authConfigured]);

  const handleVerifyOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) { setError("Enter the 6-digit code from your email."); return; }
    setError(""); setVerifying(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizeEmail(email),
        token: otpCode.trim(),
        type: "email",
      });
      if (verifyError) { setVerifying(false); setError(verifyError.message); return; }
      // onAuthStateChange will fire SIGNED_IN and call completeAccess
    } catch (err) {
      setVerifying(false);
      setError(err instanceof Error ? err.message : "Verification failed");
    }
  }, [otpCode, email]);

  const anim = dir === "fwd" ? "animate-[slide-in-right_0.3s_ease-out]" : "animate-[slide-in-left-subtle_0.3s_ease-out]";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "var(--overlay-light)", backdropFilter: "blur(16px)" }}
    >
      <div
        className="relative w-full sm:max-w-sm overflow-hidden max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        style={{ background: "#2D2323", boxShadow: "0 -20px 60px rgba(0,0,0,0.5)" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4">
          {step > 1 ? (
            <button type="button" onClick={back} className="text-white/40 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ background: "none", border: "none", cursor: "pointer" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          ) : <div className="w-11" />}
          <StepDots current={step} total={3} />
          <div className="w-11" />
        </div>

        {/* Content */}
        <div key={step} className={`px-7 pb-8 pt-2 ${anim}`}>

          {/* ═══ STEP 1: Hero with real numbers ═══ */}
          {step === 1 && (
            <div className="flex flex-col items-center text-center">
              <Image src="/branding/logo-white.svg" alt="Uppy" width={48} height={16} className="mb-6" style={{ filter: "brightness(10)" }} />

              <div className="text-[10px] font-bold uppercase tracking-[0.16em] mb-6" style={{ color: "#A58277" }}>
                Beta access
              </div>

              <h2
                className="text-[1.75rem] font-bold uppercase tracking-[-0.04em] mb-4 leading-[1.15]"
                style={{ fontFamily: "'Montserrat', var(--font-display)", color: "#fff" }}
              >
                You just found the world&apos;s thrift map
              </h2>

              {/* Animated stats */}
              <div className="grid grid-cols-3 gap-3 w-full my-6">
                  {[
                  { value: stats.stores, label: "Stores" },
                  { value: stats.cities, label: "Cities" },
                  { value: stats.countries, label: "Countries" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center py-4" style={{ background: "rgba(255,255,255,0.04)", borderRadius: 0 }}>
                    <span className="text-2xl font-bold tabular-nums" style={{ color: "#fff" }}>
                      <AnimatedNumber value={stat.value} />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] mt-1" style={{ color: "#A58277" }}>
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
                Every store hand-picked and community-verified. Built by thrifters, for thrifters.
              </p>

              <button type="button" onClick={next} className="w-full h-12 text-sm font-bold uppercase tracking-[0.16em]" style={{ background: "#fff", color: "#2D2323", border: "none", cursor: "pointer" }}>
                Show me
              </button>
            </div>
          )}

          {/* ═══ STEP 2: What you get ═══ */}
          {step === 2 && (
            <div className="flex flex-col items-center text-center">
              <h2
                className="text-[1.75rem] font-bold uppercase tracking-[-0.04em] mb-6 leading-[1.15]"
                style={{ fontFamily: "'Montserrat', var(--font-display)", color: "#fff" }}
              >
                What&apos;s inside
              </h2>

              <div className="flex flex-col gap-4 mb-6 w-full">
                {[
                  {
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A58277" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
                    title: `${stats.stores.toLocaleString()} stores`,
                    desc: "Secondhand, vintage, and thrift worldwide",
                  },
                  {
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A58277" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
                    title: "Community verified",
                    desc: "Reviews and ratings from real thrifters",
                  },
                  {
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A58277" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
                    title: `${stats.cities} cities and growing`,
                    desc: "New locations added every week by the community",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 px-4 py-4 text-left" style={{ background: "rgba(255,255,255,0.04)", borderRadius: 0 }}>
                    <span className="shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <div className="text-sm font-bold" style={{ color: "#fff" }}>{item.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>
                Sign up to also join the waitlist for Üppy Market — the platform that puts independent stores first.
              </p>

              <button type="button" onClick={next} className="w-full h-12 text-sm font-bold uppercase tracking-[0.16em]" style={{ background: "#fff", color: "#2D2323", border: "none", cursor: "pointer" }}>
                Get early access
              </button>
            </div>
          )}

          {/* ═══ STEP 3: Auth ═══ */}
          {step === 3 && !emailSent && (
            <div className="flex flex-col items-center">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "#A58277" }}>
                Only beta testers get early access
              </div>
              <h2
                className="text-[1.75rem] font-bold uppercase tracking-[-0.04em] mb-2 leading-[1.15] text-center"
                style={{ fontFamily: "'Montserrat', var(--font-display)", color: "#fff" }}
              >
                Unlock the map
              </h2>
              <p className="text-sm mb-6 text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Takes 5 seconds. You&apos;ll also be added to the Üppy Market waitlist.
              </p>

              <div className="space-y-3 w-full">
                <SocialButton provider="google" busy={oauthLoading === "google"} disabled={oauthLoading !== null || emailSubmitting} onClick={() => void handleOAuth("google")} />
              </div>

              <div className="flex items-center gap-3 my-5 w-full" style={{ color: "rgba(255,255,255,0.28)" }}>
                <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em]">or</span>
                <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
              </div>

              <form onSubmit={handleEmail} className="space-y-3 w-full">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoFocus
                  className="w-full h-11 px-4 outline-none"
                  style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.35)", color: "#fff", fontSize: "16px" }}
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="accent-[#A58277]" style={{ width: "16px", height: "16px" }} />
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>Remember me on this device</span>
                </label>
                <button
                  type="submit"
                  disabled={emailSubmitting || oauthLoading !== null}
                  className="w-full h-12 text-sm font-bold uppercase tracking-[0.16em]"
                  style={{ background: "#fff", color: "#2D2323", border: "none", cursor: emailSubmitting ? "default" : "pointer", opacity: emailSubmitting ? 0.6 : 1 }}
                >
                  {emailSubmitting ? "Sending..." : "Send code"}
                </button>
              </form>

              {error && <p className="mt-3 text-xs" style={{ color: "#E4A08A" }}>{error}</p>}

              <div className="flex flex-col gap-1.5 mt-5 w-full" style={{ color: "rgba(255,255,255,0.4)" }}>
                <span className="text-[11px]">&#10003; Instant access to the live map</span>
                <span className="text-[11px]">&#10003; Save your favorite stores</span>
                <span className="text-[11px]">&#10003; First in line for Üppy Market</span>
              </div>
            </div>
          )}

          {/* ═══ STEP 3b: Enter OTP code ═══ */}
          {step === 3 && emailSent && (
            <div className="flex flex-col items-center text-center">
              <div className="mx-auto mb-5 flex items-center justify-center" style={{ width: 56, height: 56, border: "2px solid rgba(255,255,255,0.2)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A58277" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2
                className="text-[1.75rem] font-bold uppercase tracking-[-0.04em] mb-3 leading-[1.15]"
                style={{ fontFamily: "'Montserrat', var(--font-display)", color: "#fff" }}
              >
                Enter the code
              </h2>
              <p className="text-sm leading-relaxed mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                We sent a 6-digit code to
              </p>
              <p className="text-sm font-bold mb-5" style={{ color: "#fff" }}>
                {email}
              </p>

              <form onSubmit={handleVerifyOtp} className="w-full space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  autoFocus
                  className="w-full h-14 px-4 outline-none text-center text-2xl font-bold tracking-[0.3em]"
                  style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.35)", color: "#fff", letterSpacing: "0.3em" }}
                />
                <button
                  type="submit"
                  disabled={verifying || otpCode.length < 6}
                  className="w-full h-12 text-sm font-bold uppercase tracking-[0.16em]"
                  style={{ background: "#fff", color: "#2D2323", border: "none", cursor: verifying ? "default" : "pointer", opacity: (verifying || otpCode.length < 6) ? 0.6 : 1 }}
                >
                  {verifying ? "Verifying..." : "Verify"}
                </button>
              </form>

              {error && <p className="mt-3 text-xs" style={{ color: "#E4A08A" }}>{error}</p>}

              <button
                type="button"
                onClick={() => { setEmailSent(false); setEmail(""); setOtpCode(""); setError(""); }}
                className="mt-5 text-xs font-bold uppercase tracking-[0.12em]"
                style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}
              >
                Use a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
