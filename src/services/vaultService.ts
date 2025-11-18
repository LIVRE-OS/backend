// src/services/vaultService.ts
import { encryptJSON, decryptJSON, hashBytes } from "../lib/crypto";
import type { AttributesPayload, StoredAttributes } from "../lib/types";

const vault = new Map<string, StoredAttributes>();

export function storeAttributes(identityId: string, attrs: AttributesPayload): StoredAttributes {
  // Encrypt entire attribute object
  const encrypted = encryptJSON(attrs);

  // MVP attributesRoot: hash of a deterministic string
  const attributesRoot = hashBytes(
    JSON.stringify({
      birthdate: attrs.birthdate,
      country: attrs.country,
    })
  );

  const stored: StoredAttributes = {
    encrypted,
    attributesRoot,
  };

  vault.set(identityId, stored);
  return stored;
}

export function getAttributes(identityId: string): AttributesPayload | null {
  const stored = vault.get(identityId);
  if (!stored) return null;
  return decryptJSON<AttributesPayload>(stored.encrypted);
}

export function getAttributesRoot(identityId: string): string | null {
  const stored = vault.get(identityId);
  return stored ? stored.attributesRoot : null;
}
