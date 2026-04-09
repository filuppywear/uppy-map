"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { track } from "@/lib/analytics";
import {
  isValidEmail,
  normalizeEmail,
  persistWaitlistSession,
  type WaitlistSession,
} from "@/lib/waitlist";

interface Props {
  origin: string;
  onClose: () => void;
  onComplete: (session: WaitlistSession) => void;
}

async function submitWaitlist(email: string, origin: string) {
  const response = await fetch("/api/waitlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: normalizeEmail(email),
      role: "buyer",
      source: "thrifter_map_beta",
      origin,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "Could not join the list.");
  }
}

export default function WaitlistGate({ origin, onClose, onComplete }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState("");
  const [submittedSession, setSubmittedSession] = useState<WaitlistSession | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    track("wall_viewed", { origin });
    return () => {
      document.body.style.overflow = "";
    };
  }, [origin]);

  useEffect(() => {
    if (status !== "success" || !submittedSession) return;

    const timer = setTimeout(() => {
      onComplete(submittedSession);
    }, 850);

    return () => clearTimeout(timer);
  }, [onComplete, status, submittedSession]);

  const isValid = useMemo(() => isValidEmail(email), [email]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValid) {
      setError("Please use a real email so we can let you in.");
      return;
    }

    setError("");
    setStatus("loading");

    try {
      await submitWaitlist(email, origin);

      const session: WaitlistSession = {
        email: normalizeEmail(email),
        joinedAt: new Date().toISOString(),
        origin,
        remembered: true,
      };

      persistWaitlistSession(session);
      track("email_submitted", { origin });
      setSubmittedSession(session);
      setStatus("success");
    } catch (submissionError) {
      setStatus("idle");
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <div className="waitlist-gate" role="dialog" aria-modal="true" aria-labelledby="waitlist-title">
      <div className="waitlist-gate__backdrop" onClick={onClose} />

      <div className="waitlist-gate__card">
        <button type="button" className="waitlist-gate__close" onClick={onClose} aria-label="Close waitlist">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6 18 18" />
            <path d="M18 6 6 18" />
          </svg>
        </button>

        <Image src="/branding/logo.svg" alt="Uppy" width={74} height={24} className="waitlist-gate__logo" />

        {status === "success" ? (
          <div className="waitlist-gate__success">
            <span className="waitlist-gate__eyebrow">You&apos;re in</span>
            <h2 id="waitlist-title">Opening the map...</h2>
            <p className="waitlist-gate__body">
              This device is now remembered, so next time you can come straight back in without hitting the wall again.
            </p>
            <button type="button" onClick={() => submittedSession && onComplete(submittedSession)}>
              Open the map now
            </button>
          </div>
        ) : (
          <>
            <span className="waitlist-gate__eyebrow">Unlock the Thrifter Map</span>
            <h2 id="waitlist-title">Join the early list and the live map opens right away.</h2>
            <p className="waitlist-gate__body">
              Think of it as the insider list, not a boring signup form. One email gets you into the beta and keeps this device remembered.
            </p>

            <div className="waitlist-gate__signals">
              <span>Europe-first beta</span>
              <span>Real city coverage</span>
              <span>No password needed</span>
            </div>

            <form onSubmit={handleSubmit} className="waitlist-gate__form">
              <label className="waitlist-gate__label" htmlFor="waitlist-email">
                Email
              </label>
              <input
                id="waitlist-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@somewhere.cool"
                autoComplete="email"
                autoFocus
              />

              <p className="waitlist-gate__note">
                We remember this device after signup, so the wall stays friction-light.
              </p>

              {error && <p className="waitlist-gate__error">{error}</p>}

              <button type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Joining..." : "Join and open the map"}
              </button>
            </form>

            <div className="waitlist-gate__footer">
              <span>No spam.</span>
              <span>Just access and launch updates.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
