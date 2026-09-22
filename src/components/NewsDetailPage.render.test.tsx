// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { NewsDetailPage } from "./NewsDetailPage";
import { ToastProvider } from "./ToastProvider";
import { UserProfileProvider } from "../hooks/useUserProfile";

const articleBody = `Bem-vindo ao **Portal dos Arcanos**.

\\## O que você já pode fazer

\\### Tiragens guiadas

Escolha entre modelos como **1 carta**, **3 cartas**, **Cruz Celta** e **Conselho do dia**.`;

vi.mock("../hooks/useTarot", () => {
  const state = { language: "pt" as const };
  return {
    useTarot: (selector?: (slice: typeof state) => unknown) =>
      typeof selector === "function" ? selector(state) : state,
  };
});

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    session: { access_token: "token" },
    user: {
      id: "user-1",
      email: "admin@example.com",
      user_metadata: { display_name: "Admin" },
    },
    isConfigured: true,
  }),
}));

vi.mock("../hooks/useNewsRole", () => ({
  useNewsRole: () => ({
    isAdmin: true,
    isModerator: false,
    isLoading: false,
  }),
}));

vi.mock("../lib/newsCloud", () => ({
  fetchCloudNewsById: vi.fn(async () => ({
    id: "031ff00a-41bc-465f-be07-6a485327fcbe",
    date: "05/07/2026",
    tag: "Portal",
    title: "Portal dos Arcanos esta no ar: leia, aprenda e registre suas tiragens",
    summary: "O site reune tiragens guiadas, biblioteca dos 22 Arcanos Maiores.",
    body: articleBody,
  })),
}));

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            range: () =>
              Promise.resolve({
                data: [],
                error: {
                  code: "PGRST205",
                  message: "Could not find the table 'public.site_news_comments' in the schema cache",
                },
                count: 0,
              }),
          }),
        }),
      }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => "ok" }),
    }),
    removeChannel: vi.fn(),
    rpc: vi.fn(async () => ({ data: null, error: null })),
  },
  isSupabaseConfigured: true,
}));

vi.mock("../lib/userProfileCloud", () => ({
  ensureUserProfile: vi.fn(async () => null),
  fetchUserProfile: vi.fn(async () => null),
  fetchRecentXpEvents: vi.fn(async () => []),
}));

describe("NewsDetailPage", () => {
  it("renders published article with markdown body", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <MemoryRouter>
              <UserProfileProvider
                user={
                  {
                    id: "user-1",
                    email: "admin@example.com",
                    user_metadata: { display_name: "Admin" },
                  } as never
                }
              >
                <NewsDetailPage
                  newsId="031ff00a-41bc-465f-be07-6a485327fcbe"
                  onBack={() => undefined}
                />
              </UserProfileProvider>
            </MemoryRouter>
          </ToastProvider>
        </QueryClientProvider>
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Portal dos Arcanos esta no ar/i)).toBeTruthy();
    });

    expect(screen.getByText(/Bem-vindo ao/i)).toBeTruthy();

    const article = document.getElementById("news-article-body");
    expect(article?.className).toContain("editorial-prose");
    expect(article?.className).toContain("news-detail__body");
    expect(document.querySelector(".news-detail__hero")).toBeTruthy();
    expect(document.querySelector(".news-detail__title")?.textContent).toMatch(
      /Portal dos Arcanos esta no ar/i,
    );
    expect(screen.getByRole("heading", { level: 2, name: /O que você já pode fazer/i })).toBeTruthy();
  });
});
