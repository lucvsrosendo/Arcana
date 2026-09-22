import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideHttpClient } from "@angular/common/http";
import { provideFileRouter } from "@analogjs/router";
import { providePrimeNG } from "primeng/config";
import Aura from "@primeuix/themes/aura";
import { QueryClient, provideTanStackQuery } from "@tanstack/angular-query-experimental";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideFileRouter(),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideTanStackQuery(queryClient),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: ".dark-mode",
          cssLayer: false,
        },
      },
    }),
  ],
};
