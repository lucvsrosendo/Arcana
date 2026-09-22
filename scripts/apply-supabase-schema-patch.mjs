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

const accessToken = env.SUPABASE_ACCESS_TOKEN?.trim();
const supabaseUrl = (env.VITE_SUPABASE_URL ?? "").replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/i)?.[1];

const defaultPatch = "supabase/patches/20260714_xp_full_stack.sql";
const patchArg = process.argv[2]?.trim();
const patchPath = path.resolve(patchArg || defaultPatch);

if (!fs.existsSync(patchPath)) {
  console.error(`Patch not found: ${patchPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(patchPath, "utf8");

if (!accessToken || !projectRef) {
  console.error("Could not apply patch automatically.");
  if (!accessToken) {
    console.error(
      "Add SUPABASE_ACCESS_TOKEN to .env.local (https://supabase.com/dashboard/account/tokens)",
    );
  }
  if (!projectRef) {
    console.error("Add VITE_SUPABASE_URL to .env.local");
  }
  console.error("\nOr run this SQL manually in Supabase → SQL Editor → New query → Run:\n");
  console.error(`File: ${patchPath}\n`);
  console.log(sql);
  process.exit(1);
}

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

const body = await response.json().catch(() => ({}));

if (!response.ok) {
  console.error("Patch failed:", body.message ?? body.error ?? response.statusText);
  process.exit(1);
}

console.log(`Schema patch applied successfully: ${path.relative(process.cwd(), patchPath)}`);
console.log("Run `npm run db:diagnose` to verify.");
