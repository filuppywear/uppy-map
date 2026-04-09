"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { track } from "@/lib/analytics";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
} from "@/lib/supabase-browser";
import {
  clearPendingOnboardingRole,
  getPendingOnboardingRole,
  isValidEmail,
  normalizeEmail,
  persistWaitlistSession,
  rememberPendingOnboardingRole,
  type WaitlistProvider,
  type WaitlistRole,
} from "@/lib/waitlist";

type Step = "role" | "auth" | "success";
type SocialProvider = Exclude<WaitlistProvider, "email">;

interface WaitlistPopupProps {
  onClose: () => void;
}

interface WaitlistFrameProps {
  children: ReactNode;
  onClose: () => void;
}

interface LeadPayload {
  email: string;
  role: WaitlistRole;
  source: string;
  provider?: WaitlistProvider;
  userId?: string;
  fullName?: string;
}

const OAUTH_UNAVAILABLE_MESSAGE =
  "Google and Apple sign-in will work as soon as auth keys are connected. Email unlock is ready right now.";

function WaitlistFrame({ children, onClose }: WaitlistFrameProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(18,12,12,0.75)",
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <div
        className="relative w-full max-w-sm"
        style={{ background: "#302020", padding: "40px 32px 36px" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 flex items-center justify-center"
          style={{
            width: 44,
            height: 44,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.3)",
          }}
          aria-label="Skip onboarding"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {children}
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function roleToApiRole(role: WaitlistRole | null) {
  return role === "seller" ? "seller" : "buyer";
}

function getProviderFromUser(user: User): WaitlistProvider | undefined {
  const provider = user.app_metadata?.provider;
  return provider === "google" || provider === "apple" ? provider : undefined;
}

function getFullName(user: User) {
  const metadata = user.user_metadata;
  const value =
    metadata?.full_name ??
    metadata?.name ??
    metadata?.user_name ??
    metadata?.preferred_username;

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function saveLead({
  email,
  role,
  source,
  provider,
  userId,
  fullName,
}: LeadPayload) {
  const response = await fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: normalizeEmail(email),
      role: roleToApiRole(role),
      source,
      origin: "map_onboarding",
      provider,
      userId,
      fullName,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || "Could not save waitlist access.");
  }
}

export function SocialButton({
  provider,
  busy,
  disabled,
  onClick,
}: {
  provider: SocialProvider;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const label = provider === "google" ? "Continue with Google" : "Continue with Apple";
  const icon = provider === "google" ? (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.56 2.68-3.86 2.68-6.62Z"
      />
      <path
        fill="#4285F4"
        d="M9 18c2.43 0 4.46-.8 5.95-2.18l-2.92-2.26c-.81.55-1.84.88-3.03.88-2.33 0-4.3-1.57-5-3.68H1V13.1A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M4 10.76A5.4 5.4 0 0 1 3.72 9c0-.61.1-1.2.28-1.76V4.9H1A9 9 0 0 0 0 9c0 1.45.35 2.82 1 4.1l3-2.34Z"
      />
      <path
        fill="#34A853"
        d="M9 3.58c1.32 0 2.5.46 3.43 1.35l2.57-2.57C13.45.9 11.43 0 9 0A9 9 0 0 0 1 4.9l3 2.34c.7-2.11 2.67-3.66 5-3.66Z"
      />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.37 12.62c.02 2.28 1.98 3.04 2 3.05-.02.05-.31 1.06-1.03 2.1-.62.89-1.27 1.77-2.29 1.79-1 .02-1.32-.6-2.47-.6s-1.5.58-2.44.62c-.98.04-1.73-.98-2.35-1.86-1.28-1.85-2.25-5.22-.94-7.5.65-1.13 1.82-1.85 3.08-1.87.96-.02 1.88.65 2.47.65.59 0 1.7-.8 2.86-.68.49.02 1.86.2 2.74 1.49-.07.05-1.63.95-1.62 2.81ZM14.52 4.1c.52-.63.88-1.5.78-2.37-.75.03-1.65.5-2.18 1.12-.48.56-.9 1.45-.78 2.3.83.06 1.67-.42 2.18-1.05Z" />
    </svg>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full h-11 flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-[0.12em]"
      style={{
        background: "transparent",
        border: "2px solid rgba(255,255,255,0.22)",
        color: "#FFFFFF",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {icon}
      <span>{busy ? "Opening..." : label}</span>
    </button>
  );
}

export default function WaitlistPopup({ onClose }: WaitlistPopupProps) {
  const authConfigured = hasSupabaseBrowserConfig();
  const [step, setStep] = useState<Step>(() =>
    getPendingOnboardingRole() ? "auth" : "role"
  );
  const [userType, setUserType] = useState<WaitlistRole | null>(() =>
    getPendingOnboardingRole()
  );
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<SocialProvider | null>(null);
  const completionRef = useRef(false);
  const userTypeRef = useRef<WaitlistRole | null>(getPendingOnboardingRole());

  useEffect(() => {
    userTypeRef.current = userType;
  }, [userType]);

  const finish = useCallback(() => {
    onClose();
  }, [onClose]);

  const completeAccess = useCallback(
    async ({
      email: nextEmail,
      provider,
      source,
      userId,
      fullName,
    }: {
      email: string;
      provider: WaitlistProvider;
      source: string;
      userId?: string;
      fullName?: string;
    }) => {
      if (completionRef.current) return;

      completionRef.current = true;
      const role = userTypeRef.current ?? getPendingOnboardingRole() ?? "customer";
      const normalized = normalizeEmail(nextEmail);

      try {
        await saveLead({
          email: normalized,
          role,
          source,
          provider,
          userId,
          fullName,
        });
      } catch (error) {
        completionRef.current = false;
        setEmailSubmitting(false);
        setOauthLoading(null);
        setError(
          error instanceof Error ? error.message : "Could not save waitlist access."
        );
        return;
      }

      persistWaitlistSession({
        email: normalized,
        joinedAt: new Date().toISOString(),
        origin: source,
        remembered: true,
        role,
        provider,
        userId,
        fullName,
      });

      clearPendingOnboardingRole();
      track("gate_completed", { userType: role, provider });

      setEmailSubmitting(false);
      setOauthLoading(null);
      setError("");
      setStep("success");

      window.setTimeout(finish, 900);
    },
    [finish]
  );

  const completeFromAuthUser = useCallback(
    async (user: User | null, source: string) => {
      if (!user) return;

      const nextEmail = user?.email ? normalizeEmail(user.email) : "";
      if (!nextEmail) return;

      await completeAccess({
        email: nextEmail,
        provider: getProviderFromUser(user) ?? "email",
        source,
        userId: user.id,
        fullName: getFullName(user),
      });
    },
    [completeAccess]
  );

  useEffect(() => {
    track("gate_viewed", { authConfigured });
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [authConfigured]);

  useEffect(() => {
    if (!authConfigured) return;

    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!cancelled) {
        await completeFromAuthUser(session?.user ?? null, "oauth_return");
      }
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        void completeFromAuthUser(session?.user ?? null, "oauth_return");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [authConfigured, completeFromAuthUser]);

  const roleCopy = useMemo(() => {
    if (userType === "seller") {
      return {
        eyebrow: "For sellers",
        title: "Put your store on the map first.",
        body:
          "Create your Uppy access, unlock the map now, and stay first in line for seller onboarding inside Uppy Market.",
        cta: "Reserve my spot",
      };
    }

    return {
      eyebrow: "For shoppers",
      title: "Find the best vintage, anywhere.",
      body:
        "Create your Uppy access, unlock the live map instantly, and stay on the list for everything coming next.",
      cta: "Unlock the map",
    };
  }, [userType]);

  const handleRoleSelect = useCallback((role: WaitlistRole) => {
    setUserType(role);
    userTypeRef.current = role;
    rememberPendingOnboardingRole(role);
    setError("");
    setStep("auth");
    track("gate_type_selected", { userType: role });
  }, []);

  const handleOAuth = useCallback(
    async (provider: SocialProvider) => {
      const role = userTypeRef.current ?? "customer";

      if (!authConfigured) {
        setError(OAUTH_UNAVAILABLE_MESSAGE);
        return;
      }

      setError("");
      setOauthLoading(provider);
      rememberPendingOnboardingRole(role);
      track("gate_oauth_started", { userType: role, provider });

      try {
        const supabase = createSupabaseBrowserClient();
        const { error: authError } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.href,
          },
        });

        if (authError) {
          setOauthLoading(null);
          setError(authError.message || "Could not start sign-in. Please try again.");
        }
      } catch (authError) {
        setOauthLoading(null);
        setError(
          authError instanceof Error
            ? authError.message
            : "Could not start sign-in. Please try again."
        );
      }
    },
    [authConfigured]
  );

  const handleEmailSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!isValidEmail(email)) {
        setError("Use a real email so we can remember this access.");
        return;
      }

      const role = userTypeRef.current ?? "customer";
      const normalized = normalizeEmail(email);

      setError("");
      setEmailSubmitting(true);
      track("gate_email_submitted", { userType: role });

      await completeAccess({
        email: normalized,
        provider: "email",
        source: "email_gate",
      });
    },
    [completeAccess, email]
  );

  if (step === "role") {
    return (
      <WaitlistFrame onClose={onClose}>
        <Image
          src="/branding/logo-white.svg"
          alt="Uppy"
          width={64}
          height={22}
          className="mb-8"
          style={{ filter: "brightness(10)" }}
        />
        <h2
          className="text-xl font-bold uppercase tracking-tight mb-2 leading-tight"
          style={{
            fontFamily: "'Montserrat', var(--font-display)",
            color: "#FFFFFF",
          }}
        >
          Explore the world&apos;s thrift map
        </h2>
        <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
          Pick your side first. We&apos;ll tailor the onboarding and open the map right after.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleRoleSelect("seller")}
            className="py-4 text-sm font-bold uppercase tracking-[0.16em]"
            style={{
              background: "transparent",
              border: "2px solid rgba(255,255,255,0.3)",
              color: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            I&apos;m a seller
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect("customer")}
            className="py-4 text-sm font-bold uppercase tracking-[0.16em]"
            style={{
              background: "#FFFFFF",
              color: "#302020",
              border: "none",
              cursor: "pointer",
            }}
          >
            I&apos;m a shopper
          </button>
        </div>
      </WaitlistFrame>
    );
  }

  if (step === "auth") {
    return (
      <WaitlistFrame onClose={onClose}>
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "#A58277" }}>
          {roleCopy.eyebrow}
        </div>
        <h2
          className="text-xl font-bold uppercase tracking-tight mb-2 leading-tight"
          style={{
            fontFamily: "'Montserrat', var(--font-display)",
            color: "#FFFFFF",
          }}
        >
          {roleCopy.title}
        </h2>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
          {roleCopy.body}
        </p>

        <div className="space-y-3">
          <SocialButton
            provider="google"
            busy={oauthLoading === "google"}
            disabled={oauthLoading !== null || emailSubmitting}
            onClick={() => void handleOAuth("google")}
          />
          <SocialButton
            provider="apple"
            busy={oauthLoading === "apple"}
            disabled={oauthLoading !== null || emailSubmitting}
            onClick={() => void handleOAuth("apple")}
          />
        </div>

        {!authConfigured && (
          <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.42)" }}>
            {OAUTH_UNAVAILABLE_MESSAGE}
          </p>
        )}

        <div className="flex items-center gap-3 my-5" style={{ color: "rgba(255,255,255,0.28)" }}>
          <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em]">or</span>
          <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="your@email.com"
            required
            autoFocus
            className="w-full h-11 px-4 outline-none"
            style={{
              background: "transparent",
              border: "2px solid rgba(255,255,255,0.35)",
              color: "#FFFFFF",
              fontSize: "16px",
            }}
          />
          <button
            type="submit"
            disabled={emailSubmitting || oauthLoading !== null}
            className="w-full h-11 text-sm font-bold uppercase tracking-[0.16em]"
            style={{
              background: "#FFFFFF",
              color: "#302020",
              border: "none",
              cursor: emailSubmitting ? "default" : "pointer",
              opacity: emailSubmitting ? 0.6 : 1,
            }}
          >
            {emailSubmitting ? "Opening..." : roleCopy.cta}
          </button>
        </form>

        {error && (
          <p className="mt-3 text-xs" style={{ color: "#E4A08A" }}>
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1.5 mt-5" style={{ color: "rgba(255,255,255,0.4)" }}>
          <span className="text-[11px]">&#10003; Open the map right away</span>
          <span className="text-[11px]">&#10003; Save your future favorites and routes</span>
          <span className="text-[11px]">&#10003; Stay first in line for Uppy Market</span>
        </div>
      </WaitlistFrame>
    );
  }

  return (
    <WaitlistFrame onClose={finish}>
      <div className="text-center">
        <div
          className="mx-auto mb-5 flex items-center justify-center"
          style={{ width: 48, height: 48, border: "2px solid rgba(255,255,255,0.25)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2
          className="text-xl font-bold uppercase tracking-tight mb-2"
          style={{
            fontFamily: "'Montserrat', var(--font-display)",
            color: "#FFFFFF",
          }}
        >
          You&apos;re in
        </h2>
        <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.5)" }}>
          Your access is saved. The map is opening now, and next time this device can come straight back in.
        </p>
        <button
          type="button"
          onClick={finish}
          className="w-full h-11 text-sm font-bold uppercase tracking-[0.16em]"
          style={{ background: "#FFFFFF", color: "#302020", border: "none", cursor: "pointer" }}
        >
          Open the map
        </button>
      </div>
    </WaitlistFrame>
  );
}
