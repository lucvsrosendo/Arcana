import type { PostHog } from "posthog-js";

type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean>;
};

export const hasAnalyticsConsent = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem("tarot:lgpd-consent") === "accepted";
};

const isEnabled = () => {
  if (
    typeof import.meta.env.VITE_ANALYTICS_ENABLED !== "string" ||
    import.meta.env.VITE_ANALYTICS_ENABLED !== "true"
  ) {
    return false;
  }

  return hasAnalyticsConsent();
};

const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const posthogHost = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com";
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

let posthogClient: PostHog | null = null;
let initStarted = false;

export const trackEvent = ({ name, properties }: AnalyticsEvent) => {
  if (!isEnabled()) {
    return;
  }

  if (posthogClient) {
    posthogClient.capture(name, properties);
    return;
  }

  if (import.meta.env.DEV) {
    console.info("[analytics]", name, properties ?? {});
  }
};

export const trackPageView = (path: string) => {
  trackEvent({ name: "page_view", properties: { path } });

  if (posthogClient) {
    posthogClient.capture("$pageview", { path });
  }
};

export const trackReadingFunnel = (
  step: "spread_selected" | "shuffle_complete" | "all_revealed",
  properties?: Record<string, string | number | boolean>,
) => {
  trackEvent({ name: `reading_${step}`, properties });
};

// Sentry and PostHog are ~200 KB together; they are fetched only after consent.
export const initAnalytics = () => {
  if (typeof window === "undefined" || initStarted) {
    return;
  }

  initStarted = true;

  if (sentryDsn) {
    void import("@sentry/react").then((Sentry) => {
      Sentry.init({
        dsn: sentryDsn,
        environment: import.meta.env.MODE,
      });
    });
  }

  if (!isEnabled()) {
    return;
  }

  if (posthogKey) {
    void import("posthog-js").then(({ default: posthog }) => {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        capture_pageview: false,
        capture_pageleave: true,
      });
      posthogClient = posthog;
      posthog.capture("$pageview", { path: window.location.pathname });
    });
  }

  window.addEventListener("error", (event) => {
    trackEvent({
      name: "client_error",
      properties: { message: event.message },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
    trackEvent({
      name: "unhandled_rejection",
      properties: { message: reason },
    });
  });
};
