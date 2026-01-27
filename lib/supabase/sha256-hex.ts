/**
 * SHA256 HEX - WebCrypto-based SHA-256 hex digest
 * Drop-in from ChatGPT review
 */

/**
 * sha256Hex
 * Returns lowercase hex string of SHA-256 digest.
 */
export async function sha256Hex(text: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("WebCrypto not available: crypto.subtle is undefined");
  }
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map((b) => b.toString(16).padStart(2, "0")).join("");
}
