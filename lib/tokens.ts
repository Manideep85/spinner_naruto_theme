import crypto from "crypto";
import { Prize } from "./prizes";

const SECRET_KEY = process.env.TOKEN_SECRET || "naruto-konoha-secret-chakra-key-2026";

export interface SignedTokenPayload {
  name: string;
  phone: string;
  iat: number;
  nonce: string;
}

/**
 * Create a cryptographically signed token string that works on Vercel serverless functions.
 * Format: NINJA.<base64url_payload>.<signature>
 */
export function createSignedToken(name: string, phone: string): string {
  const payload: SignedTokenPayload = {
    name: name.trim(),
    phone: phone.trim().replace(/\D/g, ""),
    iat: Date.now(),
    nonce: Math.random().toString(36).substring(2, 9),
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(payloadStr)
    .digest("base64url");

  return `NINJA.${payloadStr}.${signature}`;
}

/**
 * Verify & decode a signed token. Returns null if forged or invalid.
 */
export function verifySignedToken(tokenString: string): SignedTokenPayload | null {
  try {
    if (!tokenString || !tokenString.startsWith("NINJA.")) return null;
    const parts = tokenString.split(".");
    if (parts.length !== 3) return null;

    const [prefix, payloadStr, signature] = parts;
    if (prefix !== "NINJA") return null;

    const expectedSignature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(payloadStr)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payloadJson = Buffer.from(payloadStr, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson) as SignedTokenPayload;
    return payload;
  } catch {
    return null;
  }
}
