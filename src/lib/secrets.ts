import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Tokeny botów Discord szyfrujemy AES-256-GCM – w bazie nigdy nie leżą jawnym tekstem.

function key() {
  return createHash("sha256").update(`bot-token:${process.env.APP_SECRET}`).digest();
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
}

export function decryptSecret(payload: string) {
  const [iv, tag, enc] = payload.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export function maskToken(payload: string | null) {
  if (!payload) return null;
  try {
    const plain = decryptSecret(payload);
    return `${plain.slice(0, 6)}••••••••${plain.slice(-4)}`;
  } catch {
    return "••••••••";
  }
}
