import { afterEach, describe, expect, it } from "vitest";
import { buildNewsArticleHash, openNewsArticle, registerNewsNavigator } from "./appRouter";

describe("appRouter", () => {
  afterEach(() => {
    registerNewsNavigator(() => undefined);
  });

  it("builds the news path route", () => {
    expect(buildNewsArticleHash("oracle-chat")).toBe("/news/oracle-chat");
  });

  it("notifies the registered navigator when opening news", () => {
    const opened: string[] = [];
    registerNewsNavigator((newsId) => {
      opened.push(newsId);
    });

    openNewsArticle("oracle-chat");

    expect(opened).toEqual(["oracle-chat"]);
  });
});
