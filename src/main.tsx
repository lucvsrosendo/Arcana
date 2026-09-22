import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/cormorant-garamond/600-italic.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./components/ToastProvider";
import { ConsentBanner } from "./components/ConsentBanner";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "./hooks/useAuth";
import { hasAnalyticsConsent, initAnalytics } from "./lib/analytics";
import { initOneSignal } from "./lib/onesignal";
import { queryClient } from "./lib/queryClient";
import { AppRouter } from "./router/AppRouter";
import "./index.css";

if (hasAnalyticsConsent()) {
  initAnalytics();
  void initOneSignal();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <TooltipProvider>
            <AuthProvider>
              <ErrorBoundary>
                <AppRouter />
                <ConsentBanner />
              </ErrorBoundary>
            </AuthProvider>
          </TooltipProvider>
        </ToastProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
