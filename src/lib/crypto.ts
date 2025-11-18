import crypto from "crypto";

export function hashBytes(data: Buffer | string): string {
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export function randomId(bytes = 16): string {
  return crypto.randomBytes(bytes).toString("hex");
}

const AES_ALGO = "aes-256-gcm";

// For MVP we use a single in-memory key.
// Later: derive per-identity keys.
const MASTER_KEY = crypto.randomBytes(32);

export interface EncryptedBlob {
  ciphertext: string;
  nonce: string;
  authTag: string;
}

export function encryptJSON(obj: unknown): EncryptedBlob {
  const plaintext = Buffer.from(JSON.stringify(obj), "utf8");
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(AES_ALGO, MASTER_KEY, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    nonce: nonce.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptJSON<T = any>(blob: EncryptedBlob): T {
  const nonce = Buffer.from(blob.nonce, "base64");
  const ciphertext = Buffer.from(blob.ciphertext, "base64");
  const authTag = Buffer.from(blob.authTag, "base64");

  const decipher = crypto.createDecipheriv(AES_ALGO, MASTER_KEY, nonce);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString("utf8")) as T;
}
