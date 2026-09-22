import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { LearningPage } from "./LearningPage";

describe("LearningPage", () => {
  it("renders hand of eris content", () => {
    const html = renderToString(<LearningPage />);
    expect(html.toLowerCase()).toContain("eris");
  });
});
