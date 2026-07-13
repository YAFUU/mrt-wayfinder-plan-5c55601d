/** Dynamic QR token utility. Payload: base64({ticketId, issuedAt, expiresAt, nonce}) */
export interface QrPayload {
  ticketId: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

export const QR_ROTATE_MS = 20_000;

function randomNonce() {
  const arr = new Uint8Array(9);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateQrToken(ticketId: string, now = Date.now()): string {
  const payload: QrPayload = {
    ticketId,
    issuedAt: now,
    expiresAt: now + QR_ROTATE_MS,
    nonce: randomNonce(),
  };
  const json = JSON.stringify(payload);
  if (typeof btoa === "function") return btoa(unescape(encodeURIComponent(json)));
  return Buffer.from(json, "utf-8").toString("base64");
}

export function parseQrToken(token: string): QrPayload | null {
  try {
    const json =
      typeof atob === "function"
        ? decodeURIComponent(escape(atob(token)))
        : Buffer.from(token, "base64").toString("utf-8");
    return JSON.parse(json) as QrPayload;
  } catch {
    return null;
  }
}
