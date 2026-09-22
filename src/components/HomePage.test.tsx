// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { majorArcana } from "../data/majorArcana";
import { HomePage } from "./HomePage";

const onNavigate = vi.fn();
const openNewsArticle = vi.fn();

let newsItems: Array<{
  id: string;
  date: string;
  tag: string;
  title: string;
  summary: string;
  body: string;
}> = [];

vi.mock("@/hooks/useTarot", () => {
  const state = {
    language: "pt" as const,
    dailyCard: majorArcana[0],
    dailyStreak: 3,
  };
  return {
    useTarot: (selector?: (slice: typeof state) => unknown) =>
      typeof selector === "function" ? selector(state) : state,
  };
});

vi.mock("@/hooks/useNews", () => ({
  useNews: () => ({
    news: newsItems,
    isLoading: false,
  }),
}));

vi.mock("@/lib/openNews", () => ({
  openNewsArticle: (...args: unknown[]) => openNewsArticle(...args),
}));

describe("HomePage", () => {
  beforeEach(() => {
    cleanup();
    onNavigate.mockReset();
    openNewsArticle.mockReset();
    newsItems = [
      {
        id: "news-home-1",
        date: "13/07/2026",
        tag: "Portal",
        title: "Atualizacao do oraculo",
        summary: "Melhorias na leitura e no diario simbolico.",
        body: "Conteudo",
      },
    ];
  });

  it("navigates to reading and learn from hero CTAs", () => {
    render(<HomePage onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole("button", { name: /Fazer uma tiragem/i }));
    expect(onNavigate).toHaveBeenCalledWith("reading");

    fireEvent.click(screen.getByRole("button", { name: /Aprender a ler/i }));
    expect(onNavigate).toHaveBeenCalledWith("learn");
  });

  it("renders real Marseille arcana in the hero", () => {
    const { container } = render(<HomePage onNavigate={onNavigate} />);

    expect(container.querySelectorAll(".home-hero-card").length).toBe(3);
    expect(container.querySelector(".home-hero-legend")?.textContent).toMatch(/Marseille/i);
    expect(
      Array.from(container.querySelectorAll(".home-hero-card__caption")).map((node) =>
        node.textContent?.trim(),
      ),
    ).toEqual(["A Lua", "A Estrela", "O Sol"]);
  });

  it("opens a news article from the editorial index", () => {
    render(<HomePage onNavigate={onNavigate} />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /Abrir noticia: Atualizacao do oraculo/i })[0]!,
    );

    expect(openNewsArticle).toHaveBeenCalledWith("news-home-1");
  });

  it("hides the news section when there are no articles", () => {
    newsItems = [];
    render(<HomePage onNavigate={onNavigate} />);

    expect(screen.queryAllByText("Novidades")).toHaveLength(0);
  });

  it("opens the daily card in the arcana library", () => {
    const focusListener = vi.fn();
    window.addEventListener("arcana:focus", focusListener as EventListener);

    render(<HomePage onNavigate={onNavigate} />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /Abrir minha carta: O Louco/i })[0]!,
    );

    expect(onNavigate).toHaveBeenCalledWith("arcana");
    expect(focusListener).toHaveBeenCalled();
    const event = focusListener.mock.calls[0]?.[0] as CustomEvent<{ cardId: string }>;
    expect(event.detail.cardId).toBe("the-fool");

    window.removeEventListener("arcana:focus", focusListener as EventListener);
  });
});
