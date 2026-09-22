import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabaseClient", () => ({
  supabase: null,
}));

import { mergeLocalIntoCloudAccount } from "./tarotCloud";
import type { JournalEntry, ReadingRecord } from "../types/tarot";

const reading = (id: string, createdAt: string): ReadingRecord => ({
  id,
  spreadId: "three-card",
  spreadTitle: "Three",
  createdAt,
  cards: [],
  combinations: [],
});

const journal = (id: string, createdAt: string): JournalEntry => ({
  id,
  title: "Note",
  content: "Body",
  createdAt,
  tags: [],
});

describe("mergeLocalIntoCloudAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps local-only rows when supabase is unavailable", async () => {
    const cloud = {
      history: [reading("cloud-1", "2026-01-02T00:00:00.000Z")],
      journal: [journal("cloud-j1", "2026-01-02T00:00:00.000Z")],
    };
    const local = {
      history: [
        reading("local-1", "2026-01-03T00:00:00.000Z"),
        reading("cloud-1", "2026-01-02T00:00:00.000Z"),
      ],
      journal: [journal("local-j1", "2026-01-03T00:00:00.000Z")],
    };

    const merged = await mergeLocalIntoCloudAccount(cloud, local);

    expect(merged.history.map((item) => item.id)).toEqual(["local-1", "cloud-1"]);
    expect(merged.journal.map((item) => item.id)).toEqual(["local-j1", "cloud-j1"]);
  });
});
