import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const loadEnvFile = (filename) => {
  const filePath = resolve(filename);
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};

const normalizeSupabaseUrl = (value) =>
  value?.trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");

const parseArgs = (argv) => {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith("--")) {
      continue;
    }

    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      options[key] = "true";
      continue;
    }

    options[key] = next;
    index += 1;
  }

  return options;
};

const showHelp = () => {
  console.log(`
News admin CLI

Usage:
  node scripts/news-admin.mjs list [--limit 10]
  node scripts/news-admin.mjs add --date "06/06/2026" --tag-pt "IA" --title-pt "Titulo" --summary-pt "Resumo" [--tag-en "..."] [--title-en "..."] [--summary-en "..."] [--tag-es "..."] [--title-es "..."] [--summary-es "..."]
  node scripts/news-admin.mjs delete --id "<uuid>"
  node scripts/news-admin.mjs list-comments --news-id "<uuid>" [--limit 50]
  node scripts/news-admin.mjs delete-comment --id "<uuid>"
  node scripts/news-admin.mjs list-admins
  node scripts/news-admin.mjs list-moderators
  node scripts/news-admin.mjs grant-admin --user-id "<uuid>"
  node scripts/news-admin.mjs revoke-admin --user-id "<uuid>"
  node scripts/news-admin.mjs grant-moderator --user-id "<uuid>"
  node scripts/news-admin.mjs revoke-moderator --user-id "<uuid>"
  node scripts/news-admin.mjs delete-user --user-id "<uuid>"

Env required:
  VITE_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
`);
};

loadEnvFile(".env");
loadEnvFile(".env.local");

const command = process.argv[2];
const options = parseArgs(process.argv.slice(3));

if (!command || command === "--help" || command === "help") {
  showHelp();
  process.exit(0);
}

const supabaseUrl = normalizeSupabaseUrl(process.env.VITE_SUPABASE_URL);
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env/.env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const fallbackLanguageFields = (optionsMap, field) => {
  const pt = optionsMap[`${field}-pt`];
  return {
    pt,
    en: optionsMap[`${field}-en`] ?? pt ?? "",
    es: optionsMap[`${field}-es`] ?? pt ?? "",
  };
};

const listRoleMembers = async (tableName, label) => {
  const { data, error } = await supabase
    .from(tableName)
    .select("user_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  console.log(`${label}:`);
  console.table(data ?? []);
};

const grantRole = async (tableName, roleLabel, userId) => {
  const { error } = await supabase.from(tableName).upsert({ user_id: userId });

  if (error) {
    throw error;
  }

  console.log(`${roleLabel} granted:`, userId);
};

const revokeRole = async (tableName, roleLabel, userId) => {
  const { error } = await supabase.from(tableName).delete().eq("user_id", userId);

  if (error) {
    throw error;
  }

  console.log(`${roleLabel} revoked:`, userId);
};

const run = async () => {
  if (command === "list") {
    const limit = Number(options.limit ?? 10);
    const { data, error } = await supabase
      .from("site_news")
      .select("id, date, title_pt, tag_pt, created_at")
      .order("created_at", { ascending: false })
      .limit(Number.isFinite(limit) ? Math.max(1, limit) : 10);

    if (error) {
      throw error;
    }

    console.table(data ?? []);
    return;
  }

  if (command === "add") {
    if (!options.date || !options["title-pt"] || !options["summary-pt"]) {
      throw new Error(
        "Missing required args for add: --date, --title-pt, --summary-pt",
      );
    }

    const tag = fallbackLanguageFields(options, "tag");
    const title = fallbackLanguageFields(options, "title");
    const summary = fallbackLanguageFields(options, "summary");

    const payload = {
      date: options.date,
      tag_pt: tag.pt || "",
      tag_en: tag.en || "",
      tag_es: tag.es || "",
      title_pt: title.pt || "",
      title_en: title.en || "",
      title_es: title.es || "",
      summary_pt: summary.pt || "",
      summary_en: summary.en || "",
      summary_es: summary.es || "",
    };

    const { data, error } = await supabase
      .from("site_news")
      .insert(payload)
      .select("id, title_pt")
      .single();

    if (error) {
      throw error;
    }

    console.log("News created:", data);
    return;
  }

  if (command === "delete") {
    if (!options.id) {
      throw new Error("Missing required arg for delete: --id");
    }

    const { error } = await supabase.from("site_news").delete().eq("id", options.id);

    if (error) {
      throw error;
    }

    console.log("News deleted:", options.id);
    return;
  }

  if (command === "list-comments") {
    if (!options["news-id"]) {
      throw new Error("Missing required arg for list-comments: --news-id");
    }

    const limit = Number(options.limit ?? 50);
    const { data, error } = await supabase
      .from("site_news_comments")
      .select("id, news_id, user_id, author_display_name, body, created_at, updated_at")
      .eq("news_id", options["news-id"])
      .order("created_at", { ascending: true })
      .limit(Number.isFinite(limit) ? Math.max(1, limit) : 50);

    if (error) {
      throw error;
    }

    console.table(data ?? []);
    return;
  }

  if (command === "delete-comment") {
    if (!options.id) {
      throw new Error("Missing required arg for delete-comment: --id");
    }

    const { error } = await supabase
      .from("site_news_comments")
      .delete()
      .eq("id", options.id);

    if (error) {
      throw error;
    }

    console.log("Comment deleted:", options.id);
    return;
  }

  if (command === "list-admins") {
    await listRoleMembers("site_news_admins", "Admins");
    return;
  }

  if (command === "list-moderators") {
    await listRoleMembers("site_news_moderators", "Moderators");
    return;
  }

  if (command === "grant-admin") {
    if (!options["user-id"]) {
      throw new Error("Missing required arg for grant-admin: --user-id");
    }

    await grantRole("site_news_admins", "Admin", options["user-id"]);
    return;
  }

  if (command === "revoke-admin") {
    if (!options["user-id"]) {
      throw new Error("Missing required arg for revoke-admin: --user-id");
    }

    await revokeRole("site_news_admins", "Admin", options["user-id"]);
    return;
  }

  if (command === "grant-moderator") {
    if (!options["user-id"]) {
      throw new Error("Missing required arg for grant-moderator: --user-id");
    }

    await grantRole("site_news_moderators", "Moderator", options["user-id"]);
    return;
  }

  if (command === "revoke-moderator") {
    if (!options["user-id"]) {
      throw new Error("Missing required arg for revoke-moderator: --user-id");
    }

    await revokeRole("site_news_moderators", "Moderator", options["user-id"]);
    return;
  }

  if (command === "delete-user") {
    if (!options["user-id"]) {
      throw new Error("Missing required arg for delete-user: --user-id");
    }

    const userId = options["user-id"];

    await supabase.from("site_news_comment_likes").delete().eq("user_id", userId);
    await supabase.from("site_news_comment_favorites").delete().eq("user_id", userId);
    await supabase.from("site_news_comments").delete().eq("user_id", userId);
    await supabase.from("user_xp_events").delete().eq("user_id", userId);
    await supabase.from("tarot_readings").delete().eq("user_id", userId);
    await supabase.from("tarot_journal_entries").delete().eq("user_id", userId);
    await supabase.from("user_profiles").delete().eq("user_id", userId);
    await supabase.from("site_news_admins").delete().eq("user_id", userId);
    await supabase.from("site_news_moderators").delete().eq("user_id", userId);

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      throw authDeleteError;
    }

    console.log("User deleted:", userId);
    return;
  }

  showHelp();
  process.exit(1);
};

run().catch((error) => {
  console.error("news-admin failed:", error.message ?? error);
  process.exit(1);
});
