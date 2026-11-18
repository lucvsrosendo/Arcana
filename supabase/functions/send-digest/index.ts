import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";

const MAX_FIELD_CHARS = 8_000;

const timingSafeEqual = (left: string, right: string) => {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) {
    diff |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return diff === 0;
};

const jsonResponse = (request: Request, status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...buildCorsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: buildCorsHeaders(request) });
  }

  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "Method not allowed" });
  }

  const digestSecret = Deno.env.get("DIGEST_SECRET") ?? "";
  const providedSecret = request.headers.get("x-digest-secret") ?? "";
  if (!digestSecret || !timingSafeEqual(digestSecret, providedSecret)) {
    return jsonResponse(request, 401, { error: "Unauthorized." });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");

  if (!resendKey || !fromEmail) {
    return jsonResponse(request, 503, { error: "Email is not configured." });
  }

  try {
    const body = await request.json();
    const to = typeof body.to === "string" ? body.to.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.slice(0, 200) : "Tarot Oracle digest";
    const html = typeof body.html === "string" ? body.html.slice(0, MAX_FIELD_CHARS) : "<p>Your weekly tarot digest.</p>";

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return jsonResponse(request, 400, { error: "Missing recipient." });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: fromEmail, to, subject, html }),
    });

    if (!response.ok) {
      return jsonResponse(request, 502, { error: "Send failed." });
    }

    return jsonResponse(request, 200, { ok: true });
  } catch (error) {
    console.error("send-digest failed", error);
    return jsonResponse(request, 500, { error: "Send failed." });
  }
});
