import { Injectable } from "@angular/core";
import * as Sentry from "@sentry/angular";
import posthog from "posthog-js";

type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean>;
};

@Injectable({ providedIn: "root" })
export class AnalyticsService {
  private initialized = false;
  private sentryInitialized = false;

  private isEnabled() {
    return import.meta.env.VITE_ANALYTICS_ENABLED === "true";
  }

  init() {
    if (typeof window === "undefined") {
      return;
    }

    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    if (sentryDsn && !this.sentryInitialized) {
      Sentry.init({
        dsn: sentryDsn,
        environment: import.meta.env.MODE,
      });
      this.sentryInitialized = true;
    }

    if (!this.isEnabled() || this.initialized) {
      return;
    }

    const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
    const posthogHost = import.meta.env.VITE_POSTHOG_HOST ?? "https://us.i.posthog.com";

    if (posthogKey) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        capture_pageview: false,
        capture_pageleave: true,
      });
      this.initialized = true;
    }
  }

  trackEvent({ name, properties }: AnalyticsEvent) {
    if (!this.isEnabled()) {
      return;
    }

    if (this.initialized) {
      posthog.capture(name, properties);
      return;
    }

    console.info("[analytics]", name, properties ?? {});
  }

  trackPageView(path: string) {
    this.trackEvent({ name: "page_view", properties: { path } });

    if (this.initialized) {
      posthog.capture("$pageview", { path });
    }
  }

  trackReadingFunnel(
    step: "spread_selected" | "shuffle_complete" | "all_revealed" | "reading_saved",
    properties?: Record<string, string | number | boolean>,
  ) {
    this.trackEvent({ name: `reading_${step}`, properties });
  }
}
