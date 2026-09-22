/** Fixes escaped heading markers (e.g. `\## Title`) before markdown render. */
export function normalizeNewsMarkdown(body: string): string {
  return body.replace(/^\\(#{1,6})\s/gm, "$1 ");
}
