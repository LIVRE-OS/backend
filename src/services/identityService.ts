// src/services/identityService.ts
import { randomBytes, createHash } from "crypto";
import type { IdentityRecord } from "../lib/types";

const identities = new Map<string, IdentityRecord>();

function randomId(): string {
  return randomBytes(16).toString("hex");
}

function makeCommitment(
  controlKey: string,
  recoveryKey: string,
  attributesRoot: string,
  policiesRoot: string
): string {
  const h = createHash("sha256");
  h.update(controlKey);
  h.update(recoveryKey);
  h.update(attributesRoot);
  h.update(policiesRoot);
  return h.digest("hex");
}

export function createIdentity(): IdentityRecord {
  const identityId = randomId();
  const controlKey = randomId();
  const recoveryKey = randomId();
  const attributesRoot = randomId();
  const policiesRoot = randomId();

  const commitment = makeCommitment(
    controlKey,
    recoveryKey,
    attributesRoot,
    policiesRoot
  );

  const record: IdentityRecord = {
    identityId,
    commitment,
    attributesRoot,
    createdAt: new Date().toISOString(),
  };

  identities.set(identityId, record);
  return record;
}

export function getIdentity(id: string): IdentityRecord | undefined {
  return identities.get(id);
}
