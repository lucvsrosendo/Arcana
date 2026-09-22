import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, sep, resolve } from "node:path";
import { handleCardInsightRequest, handleChatRequest } from "./chat-api.mjs";

const root = resolve("dist");
const rootWithSeparator = root.endsWith(sep) ? root : `${root}${sep}`;
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 4173);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "media-src 'self' data: blob:",
    // The browser only talks to Supabase directly; Groq is reached server-side via /api/chat.
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "upgrade-insecure-requests",
  ].join("; "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const writeSecurityHeaders = (response) => {
  Object.entries(securityHeaders).forEach(([header, value]) => {
    response.setHeader(header, value);
  });
};

const getSafeFilePath = (requestUrl) => {
  let requestPath = "/";

  try {
    requestPath = decodeURIComponent(requestUrl?.split("?")[0] ?? "/");
  } catch {
    return null;
  }

  const candidatePath = resolve(root, `.${requestPath}`);
  const isInsideRoot =
    candidatePath === root || candidatePath.startsWith(rootWithSeparator);

  if (!isInsideRoot) {
    return null;
  }

  return existsSync(candidatePath) && statSync(candidatePath).isFile()
    ? candidatePath
    : resolve(root, "index.html");
};

const sendFile = (filePath, response) => {
  const isIndex = filePath === resolve(root, "index.html");

  response.writeHead(200, {
    ...securityHeaders,
    "Cache-Control": isIndex ? "no-cache" : "public, max-age=31536000, immutable",
    "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
};

const server = createServer((request, response) => {
  writeSecurityHeaders(response);
  const requestPath = request.url?.split("?")[0] ?? "/";

  if (requestPath === "/api/chat") {
    void handleChatRequest(request, response);
    return;
  }

  if (requestPath === "/api/interpret-card") {
    void handleCardInsightRequest(request, response);
    return;
  }

  const filePath = getSafeFilePath(request.url);

  if (!filePath) {
    response.writeHead(400, {
      ...securityHeaders,
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Invalid request path.");
    return;
  }

  sendFile(filePath, response);
});

server.listen(port, host, () => {
  console.log(`Tarot app running at http://${host}:${port}/`);
});
