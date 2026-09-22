import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(".env.local");
const env = {};

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  }
}

const url = (env.VITE_SUPABASE_URL ?? "").replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
const key = (env.VITE_SUPABASE_ANON_KEY ?? "").trim();

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const probes = [
  {
    name: "site_news",
    path: "/rest/v1/site_news?select=id&limit=1",
  },
  {
    name: "site_news_comments",
    path: "/rest/v1/site_news_comments?select=id&limit=1",
  },
  {
    name: "user_profiles",
    path: "/rest/v1/user_profiles?select=user_id,xp_total&limit=1",
  },
  {
    name: "user_xp_events",
    path: "/rest/v1/user_xp_events?select=id&limit=1",
  },
  {
    name: "user_article_reads",
    path: "/rest/v1/user_article_reads?select=user_id&limit=1",
  },
  {
    name: "tarot_readings (full)",
    path: "/rest/v1/tarot_readings?select=id,spread_id,spread_title,created_at,question,cards,combinations&limit=1",
  },
  {
    name: "tarot_readings (legacy)",
    path: "/rest/v1/tarot_readings?select=id,spread_id,spread_title,created_at,cards,combinations&limit=1",
  },
  {
    name: "tarot_journal_entries (full)",
    path: "/rest/v1/tarot_journal_entries?select=id,title,content,manifestation,tags,created_at,linked_reading_id&limit=1",
  },
  {
    name: "tarot_journal_entries (legacy)",
    path: "/rest/v1/tarot_journal_entries?select=id,title,content,created_at,linked_reading_id&limit=1",
  },
];

const results = [];

try {
  // Quick DNS/reachability check so diagnose fails clearly when the project is gone.
  await fetch(`${url}/auth/v1/health`, { signal: AbortSignal.timeout(8000) });
} catch (error) {
  const cause = error instanceof Error ? error.cause : null;
  const code =
    cause && typeof cause === "object" && "code" in cause
      ? String(cause.code)
      : error instanceof Error
        ? error.message
        : String(error);
  console.error("Supabase host unreachable.");
  console.error(`URL: ${url}`);
  console.error(`Error: ${code}`);
  console.error(
    "\nThe project ref in VITE_SUPABASE_URL no longer resolves (deleted/paused DNS).",
  );
  console.error(
    "Open https://supabase.com/dashboard → restore or create a project → copy new URL + anon key into .env.local",
  );
  process.exit(1);
}

for (const probe of probes) {
  const response = await fetch(`${url}${probe.path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  results.push({
    name: probe.name,
    status: response.status,
    ok: response.ok,
    message: body?.message ?? body?.error ?? null,
  });
}

console.log("Supabase schema diagnosis\n");
for (const result of results) {
  const status = result.ok ? "OK" : "FAIL";
  console.log(`[${status}] ${result.name} (${result.status})`);
  if (result.message) {
    console.log(`       ${result.message}`);
  }
}

const needsPatch = results.some(
  (result) =>
    result.name.includes("(full)") &&
    !result.ok &&
    results.some((legacy) => legacy.name.includes("(legacy)") && legacy.ok),
);

if (needsPatch) {
  console.log("\nLegacy schema detected. Run:");
  console.log("  npm run db:patch");
  console.log("Or paste supabase/patches/20260705_legacy_schema_sync.sql in the Supabase SQL Editor.");
}

const xpMissing = ["site_news_comments", "user_profiles", "user_xp_events"].some((name) =>
  results.some((result) => result.name === name && !result.ok),
);

if (xpMissing) {
  console.log("\nXP / comments schema missing. Run:");
  console.log("  npm run db:patch");
  console.log("Or paste supabase/patches/20260714_xp_full_stack.sql in the Supabase SQL Editor.");
}
