declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const payload = {
    event,
    ...props,
    timestamp: Date.now(),
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);

  if (typeof window.gtag === "function") {
    window.gtag("event", event, props || {});
  }

  if (typeof window.plausible === "function") {
    window.plausible(event, { props });
  }

  window.dispatchEvent(new CustomEvent("uppy:analytics", { detail: payload }));

  if (process.env.NODE_ENV !== "production") {
    console.log("[analytics]", event, props ?? "");
  }
}
