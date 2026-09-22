import { describe, expect, it } from "vitest";

// Mirrors journalCrypto toBase64 chunking without DOM globals.
const toBase64 = (bytes: Uint8Array) => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
};

describe("journalCrypto base64 helpers", () => {
  it("encodes large payloads without stack overflow", () => {
    const bytes = new Uint8Array(100_000);
    bytes.fill(7);
    const encoded = toBase64(bytes);
    expect(encoded.length).toBeGreaterThan(0);
    expect(() => atob(encoded)).not.toThrow();
  });
});
