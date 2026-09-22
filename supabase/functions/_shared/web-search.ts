/** DuckDuckGo Instant Answer — no API key required (AI Tools Registry pattern) */
export const webSearch = async (query: string) => {
  const url = new URL("https://api.duckduckgo.com/");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("no_redirect", "1");
  url.searchParams.set("no_html", "1");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Web search failed: ${response.status}`);
  }

  const payload = await response.json();
  const abstract = typeof payload.AbstractText === "string" ? payload.AbstractText : "";
  const related = Array.isArray(payload.RelatedTopics)
    ? payload.RelatedTopics
        .map((topic: { Text?: string }) => topic.Text)
        .filter(Boolean)
        .slice(0, 3)
        .join("\n")
    : "";

  return [abstract, related].filter(Boolean).join("\n\n").trim() || "No results found.";
};
