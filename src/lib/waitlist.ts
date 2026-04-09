export const WAITLIST_STORAGE_KEY = "uppy_waitlist_v1";
const WAITLIST_PENDING_ROLE_KEY = "uppy_waitlist_pending_role_v1";
const WAITLIST_SESSION_STORAGE_KEY = "uppy_waitlist_session_v1";

export type WaitlistRole = "seller" | "customer";
export type WaitlistProvider = "email" | "google" | "apple";

export interface WaitlistSession {
  email: string;
  joinedAt: string;
  origin: string;
  remembered: boolean;
  role?: WaitlistRole;
  provider?: WaitlistProvider;
  userId?: string;
  fullName?: string;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function canUseStorage() {
  return typeof window !== "undefined";
}

export function readWaitlistSession(): WaitlistSession | null {
  if (!canUseStorage()) return null;

  try {
    const raw =
      window.localStorage.getItem(WAITLIST_STORAGE_KEY) ??
      window.sessionStorage.getItem(WAITLIST_SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<WaitlistSession>;
    if (!parsed || typeof parsed.email !== "string") {
      return null;
    }

    const remembered = parsed.remembered === true;

    return {
      email: normalizeEmail(parsed.email),
      joinedAt:
        typeof parsed.joinedAt === "string" ? parsed.joinedAt : new Date().toISOString(),
      origin: typeof parsed.origin === "string" ? parsed.origin : "unknown",
      remembered,
      role: parsed.role === "seller" ? "seller" : parsed.role === "customer" ? "customer" : undefined,
      provider:
        parsed.provider === "google" ||
        parsed.provider === "apple" ||
        parsed.provider === "email"
          ? parsed.provider
          : undefined,
      userId: typeof parsed.userId === "string" ? parsed.userId : undefined,
      fullName: typeof parsed.fullName === "string" ? parsed.fullName : undefined,
    };
  } catch {
    return null;
  }
}

export function hasWaitlistAccess() {
  return Boolean(readWaitlistSession());
}

export function persistWaitlistSession(session: WaitlistSession) {
  if (!canUseStorage()) return;

  try {
    const normalized = {
      ...session,
      email: normalizeEmail(session.email),
      remembered: session.remembered === true,
    };

    if (normalized.remembered) {
      window.localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(normalized));
      window.sessionStorage.removeItem(WAITLIST_SESSION_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(
      WAITLIST_SESSION_STORAGE_KEY,
      JSON.stringify(normalized)
    );
    window.localStorage.removeItem(WAITLIST_STORAGE_KEY);
  } catch {
    // Ignore storage failures so the UI can keep moving.
  }
}

export function clearWaitlistSession() {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(WAITLIST_STORAGE_KEY);
    window.sessionStorage.removeItem(WAITLIST_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage failures so the UI can keep moving.
  }
}

export function rememberPendingOnboardingRole(role: WaitlistRole) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(WAITLIST_PENDING_ROLE_KEY, role);
  } catch {
    // Ignore storage failures so the UI can keep moving.
  }
}

export function getPendingOnboardingRole(): WaitlistRole | null {
  if (!canUseStorage()) return null;

  try {
    const value = window.localStorage.getItem(WAITLIST_PENDING_ROLE_KEY);
    return value === "seller" || value === "customer" ? value : null;
  } catch {
    return null;
  }
}

export function clearPendingOnboardingRole() {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(WAITLIST_PENDING_ROLE_KEY);
  } catch {
    // Ignore storage failures so the UI can keep moving.
  }
}
