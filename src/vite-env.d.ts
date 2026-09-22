/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_CHAT_API_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_ANALYTICS_ENABLED?: string;
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_POSTHOG_HOST?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_ONESIGNAL_APP_ID?: string;
  readonly VITE_COOKIEBOT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
