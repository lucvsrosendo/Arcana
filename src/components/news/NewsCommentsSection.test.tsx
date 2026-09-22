// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NewsCommentsSection } from "./NewsCommentsSection";
import { UserProfileProvider } from "@/hooks/useUserProfile";
import { TooltipProvider } from "@/components/ui/tooltip";

const addComment = vi.fn(async () => ({
  id: "c1",
  newsId: "news-1",
  userId: "user-normal",
  body: "hello",
  authorDisplayName: "Reader",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  likeCount: 0,
  favoriteCount: 0,
  likedByCurrentUser: false,
  favoritedByCurrentUser: false,
}));

const pushToast = vi.fn();
const pushXpGain = vi.fn();

let authSession: { access_token: string } | null = { access_token: "token" };

vi.mock("@/components/ToastProvider", () => ({
  useToast: () => ({ pushToast, pushXpGain }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/hooks/useTarot", () => {
  const state = { language: "pt" as const };
  return {
    useTarot: (selector?: (slice: typeof state) => unknown) =>
      typeof selector === "function" ? selector(state) : state,
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    session: authSession,
    user: authSession
      ? {
          id: "user-normal",
          email: "reader@example.com",
          user_metadata: { display_name: "Reader" },
        }
      : null,
    isConfigured: true,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/hooks/useNewsRole", () => ({
  useNewsRole: () => ({
    isAdmin: false,
    isModerator: false,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useNewsComments", () => ({
  useNewsComments: () => ({
    comments: [],
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    commentsFeatureAvailable: true,
    usingLocalFallback: false,
    error: null,
    addComment,
    editComment: vi.fn(),
    removeComment: vi.fn(),
    toggleLike: vi.fn(),
    toggleFavorite: vi.fn(),
    loadMore: vi.fn(),
    canEdit: () => false,
    canDelete: () => false,
    canInteract: () => true,
  }),
}));

vi.mock("@/lib/userProfileCloud", () => ({
  ensureUserProfile: vi.fn(async () => null),
  fetchUserProfile: vi.fn(async () => null),
  fetchRecentXpEvents: vi.fn(async () => []),
}));

const renderSection = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserProfileProvider
          user={
            authSession
              ? ({
                  id: "user-normal",
                  email: "reader@example.com",
                  user_metadata: { display_name: "Reader" },
                } as never)
              : null
          }
        >
          <NewsCommentsSection newsId="news-1" />
        </UserProfileProvider>
      </TooltipProvider>
    </QueryClientProvider>,
  );
};

describe("NewsCommentsSection composer", () => {
  beforeEach(() => {
    cleanup();
    addComment.mockReset();
    addComment.mockImplementation(async () => ({
      id: "c1",
      newsId: "news-1",
      userId: "user-normal",
      body: "hello",
      authorDisplayName: "Reader",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likeCount: 0,
      favoriteCount: 0,
      likedByCurrentUser: false,
      favoritedByCurrentUser: false,
    }));
    pushToast.mockClear();
    pushXpGain.mockClear();
    authSession = { access_token: "token" };
  });

  it("shows a visible textarea and submit for a logged-in non-admin user", () => {
    renderSection();

    expect(screen.queryByText(/Faca login para comentar/i)).toBeNull();
    expect(screen.getByRole("textbox")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Comentar/i })).toBeTruthy();
  });

  it("keeps the composer box visible when logged out", () => {
    authSession = null;
    renderSection();

    expect(screen.getByText(/Faca login para comentar/i)).toBeTruthy();
    expect(screen.getByRole("textbox")).toBeTruthy();
    expect(
      (screen.getByRole("textbox") as HTMLTextAreaElement).disabled,
    ).toBe(false);
  });

  it("shows a schema-specific toast when comment save fails with schema error", async () => {
    addComment.mockRejectedValueOnce({
      code: "PGRST204",
      message: "Could not find the 'parent_id' column of 'site_news_comments' in the schema cache",
    });

    renderSection();

    const form = screen.getByRole("textbox").closest("form");
    expect(form).toBeTruthy();

    fireEvent.input(screen.getByRole("textbox"), {
      target: { value: "comentario de teste" },
    });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(pushToast).toHaveBeenCalledWith(
        expect.stringMatching(/tabela de comentarios ainda nao existe/i),
        "error",
      );
    });
  });
});
