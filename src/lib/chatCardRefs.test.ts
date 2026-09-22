import { describe, expect, it } from "vitest";
import { linkifyCardNames } from "./chatCardRefs";

describe("linkifyCardNames", () => {
  it("wraps card names with card links", () => {
    const result = linkifyCardNames("Vejo O Louco e A Torre juntos.", [
      { name: "O Louco", slotId: "past" },
      { name: "A Torre", slotId: "future" },
    ]);

    expect(result).toContain("[O Louco](card:past)");
    expect(result).toContain("[A Torre](card:future)");
  });
});
