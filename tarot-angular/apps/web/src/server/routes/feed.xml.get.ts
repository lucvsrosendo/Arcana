import { defineEventHandler, setHeader } from "h3";
import { createClient } from "@supabase/supabase-js";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export default defineEventHandler(async (event) => {
  const siteUrl = (process.env.VITE_SITE_URL ?? "https://tarot.example.com").replace(/\/$/, "");
  const updatedAt = new Date().toUTCString();

  let items = `<item>
      <title>Welcome to Tarot</title>
      <link>${siteUrl}/news/welcome</link>
      <guid isPermaLink="true">${siteUrl}/news/welcome</guid>
      <pubDate>${updatedAt}</pubDate>
      <description>Explore readings, journal entries, and symbolic learning.</description>
    </item>`;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const client = createClient(supabaseUrl, supabaseKey);
    const { data } = await client
      .from("site_news")
      .select("id, title_pt, summary_pt, published_at")
      .order("published_at", { ascending: false })
      .limit(20);

    if (data?.length) {
      items = data
        .map((row) => {
          const title = escapeXml((row.title_pt as string) ?? "News");
          const summary = escapeXml((row.summary_pt as string) ?? "");
          const id = row.id as string;
          const pubDate = new Date((row.published_at as string) ?? Date.now()).toUTCString();
          return `<item>
      <title>${title}</title>
      <link>${siteUrl}/news/${id}</link>
      <guid isPermaLink="true">${siteUrl}/news/${id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${summary}</description>
    </item>`;
        })
        .join("\n");
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Tarot Major Arcana</title>
    <link>${siteUrl}</link>
    <description>News and reflections from the Tarot web app.</description>
    <language>pt-BR</language>
    <lastBuildDate>${updatedAt}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  setHeader(event, "Content-Type", "application/rss+xml; charset=utf-8");
  return xml;
});
