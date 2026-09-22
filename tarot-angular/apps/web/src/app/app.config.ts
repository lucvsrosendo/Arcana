import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideClientHydration } from "@angular/platform-browser";
import { provideFileRouter } from "@analogjs/router";
import { withComponentInputBinding } from "@angular/router";
import { provideTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { QueryClient, provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { provideMarkdown } from "ngx-markdown";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideFileRouter(withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideTanStackQuery(queryClient),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: "/assets/i18n/",
        suffix: ".json",
      }),
      fallbackLang: "pt",
      lang: "pt",
    }),
    provideClientHydration(),
    provideMarkdown(),
  ],
};
