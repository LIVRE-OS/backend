// src/services/vault.ts
// Minimal encrypted vault that persists IdentityRecord objects to disk.
import { promises as fsPromises } from "fs";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";
import type { IdentityRecord } from "../lib/types";

interface VaultState {
  identities: IdentityRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const VAULT_FILE = path.join(DATA_DIR, "vault.json.enc");
const DEFAULT_PASSPHRASE = "livre-dev-default";
const PASSPHRASE =
  process.env.VAULT_PASSPHRASE && process.env.VAULT_PASSPHRASE.trim().length > 0
    ? process.env.VAULT_PASSPHRASE
    : DEFAULT_PASSPHRASE;

if (PASSPHRASE === DEFAULT_PASSPHRASE) {
  console.warn(
    "[vault] VAULT_PASSPHRASE not set. Using the insecure default passphrase; do not use in production."
  );
}

const AES_ALGO = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SALT_LENGTH = 16;

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function deriveKey(salt: Buffer): Buffer {
  return scryptSync(PASSPHRASE, salt, 32);
}

function encryptBuffer(payload: Buffer): Buffer {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(salt);
  const cipher = createCipheriv(AES_ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, authTag, ciphertext]);
}

function decryptBuffer(encrypted: Buffer): Buffer {
  if (encrypted.length < SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
    throw new Error("Vault payload too small");
  }
  const salt = encrypted.subarray(0, SALT_LENGTH);
  const iv = encrypted.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = encrypted.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  );
  const ciphertext = encrypted.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const key = deriveKey(salt);
  const decipher = createDecipheriv(AES_ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function parseVaultState(buffer: Buffer): VaultState {
  try {
    const raw = JSON.parse(buffer.toString("utf8")) as VaultState;
    if (!raw || !Array.isArray(raw.identities)) {
      return { identities: [] };
    }
    return {
      identities: raw.identities.map((record) => ({
        ...record,
        attributes: record.attributes
          ? { ...record.attributes }
          : record.attributes,
      })),
    };
  } catch {
    return { identities: [] };
  }
}

export function loadVaultState(): VaultState {
  if (!existsSync(VAULT_FILE)) {
    return { identities: [] };
  }
  try {
    const encrypted = readFileSync(VAULT_FILE);
    if (!encrypted.length) {
      return { identities: [] };
    }
    const decrypted = decryptBuffer(encrypted);
    return parseVaultState(decrypted);
  } catch (err) {
    console.error("[vault] Failed to load vault:", err);
    return { identities: [] };
  }
}

export function saveVaultState(state: VaultState): void {
  ensureDataDir();
  const snapshot: VaultState = {
    identities: state.identities.map((record) => ({
      ...record,
      attributes: record.attributes
        ? { ...record.attributes }
        : record.attributes,
    })),
  };
  const payload = Buffer.from(JSON.stringify(snapshot, null, 2), "utf8");
  const encrypted = encryptBuffer(payload);
  writeFileSync(VAULT_FILE, encrypted);
}

export async function deleteVaultFile(): Promise<void> {
  try {
    await fsPromises.unlink(VAULT_FILE);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }
}
