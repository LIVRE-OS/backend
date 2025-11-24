// src/services/proofService.ts
// MVP deterministic proofs for the Agent/Verifier demos. Not real crypto commitments.

import { createHash } from "crypto";
import { hashBytes } from "../lib/crypto";
import type {
  ProofRequest,
  ProofBundle,
  AttributesPayload,
  IdentityRecord,
} from "../lib/types";
import { getIdentity, persistIdentityStore } from "./identityService";
import { DEFAULT_TEMPLATE_ID } from "../config";

interface SetAttributesResult {
  identityId: string;
  commitment: string;
  attributesRoot: string;
}

// -----------------------------------------------
// Attribute Hashing
// -----------------------------------------------
function hashAttributes(attrs: AttributesPayload): string {
  return hashBytes(
    JSON.stringify({
      birthdate: attrs.birthdate,
      country: attrs.country,
    })
  );
}

function computeCommitment(
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

function computeProofHash({
  identityId,
  templateId,
  commitment,
  attributesRoot,
}: {
  identityId: string;
  templateId: string;
  commitment: string;
  attributesRoot?: string | null;
}): string {
  const root = attributesRoot ?? "";
  return createHash("sha256")
    .update(identityId)
    .update(templateId)
    .update(commitment)
    .update(root)
    .digest("hex");
}

// -----------------------------------------------
// Birthdate parsing & age
// -----------------------------------------------
function parseBirthdate(value: string): Date | null {
  const [year, month, day] = value.split("-").map((n) => Number(n));
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year &&
    d.getUTCMonth() + 1 === month &&
    d.getUTCDate() === day
    ? d
    : null;
}

function calculateAge(birthdate: Date, now: Date): number {
  let age = now.getUTCFullYear() - birthdate.getUTCFullYear();
  const m = now.getUTCMonth() - birthdate.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birthdate.getUTCDate())) {
    age--;
  }
  return age;
}

// -----------------------------------------------
// Template Enforcement
// -----------------------------------------------
function attributesMeetTemplateRequirements(
  identity: IdentityRecord,
  templateId: string
): boolean {
  const attrs = identity.attributes;
  if (!attrs || !attrs.birthdate || !attrs.country) {
    return false;
  }

  const parsedBirthdate = parseBirthdate(attrs.birthdate);
  if (!parsedBirthdate) return false;

  const age = calculateAge(parsedBirthdate, new Date());
  const country = attrs.country.toUpperCase();

  switch (templateId) {
    case DEFAULT_TEMPLATE_ID:
      return age >= 18 && country === "PT";
    default:
      return false;
  }
}

// -----------------------------------------------
// Attribute Setter
// -----------------------------------------------
export function setAttributes(
  identityId: string,
  attrs: AttributesPayload
): SetAttributesResult {
  const identity = getIdentity(identityId);
  if (!identity) {
    throw new Error("Identity not found");
  }

  const attributesRoot = hashAttributes(attrs);
  const commitment = computeCommitment(
    identity.controlKey,
    identity.recoveryKey,
    attributesRoot,
    identity.policiesRoot
  );

  identity.attributes = {
    birthdate: attrs.birthdate,
    country: attrs.country,
  };
  identity.attributesRoot = attributesRoot;
  identity.commitment = commitment;

  persistIdentityStore();

  return { identityId, commitment, attributesRoot };
}

// -----------------------------------------------
// Proof Generation
// -----------------------------------------------
export function generateProof(req: ProofRequest): ProofBundle | null {
  const identity = getIdentity(req.identityId);
  if (!identity) {
    return null;
  }

  if (identity.commitment !== req.commitment) {
    return null;
  }

  if (!attributesMeetTemplateRequirements(identity, req.templateId)) {
    return null;
  }

  const proofHash = computeProofHash({
    identityId: req.identityId,
    templateId: req.templateId,
    commitment: identity.commitment,
    attributesRoot: identity.attributesRoot,
  });

  const proof: ProofBundle = {
    identityId: req.identityId,
    templateId: req.templateId,
    proofHash,
    issuedAt: new Date().toISOString(),
  };

  // store for Vault view
  registerProofInVault({
    identityId: proof.identityId,
    templateId: proof.templateId,
    proofHash: proof.proofHash,
    issuedAt: proof.issuedAt,
  });

  return proof;
}
// -----------------------------------------------
// PROOF VERIFICATION
// -----------------------------------------------
export function verifyProof(
  identityPayload: { identityId: string },
  bundle: ProofBundle
): boolean {
  const { identityId } = identityPayload;
  const { templateId, proofHash } = bundle;

  // 1. Identity in payload must match identity in proof
  if (identityId !== bundle.identityId) {
    return false;
  }

  // 2. Load stored identity
  const stored = getIdentity(identityId);
  if (!stored) {
    return false;
  }

  // 3. Check that stored attributes satisfy the template
  if (!attributesMeetTemplateRequirements(stored, templateId)) {
    return false;
  }

  // 4. Ensure we have an attributesRoot for this identity
  let attributesRoot = stored.attributesRoot;
  if (!attributesRoot && stored.attributes) {
    // recompute using the same logic as setAttributes()
    attributesRoot = hashAttributes(stored.attributes as AttributesPayload);
    stored.attributesRoot = attributesRoot;
    persistIdentityStore();
  }

  if (!attributesRoot) {
    return false;
  }

  // 5. Recompute the expected proof hash from stored values
  const expectedHash = computeProofHash({
    identityId: stored.identityId,
    templateId,
    commitment: stored.commitment,
    attributesRoot,
  });

  // 6. Final decision
  return expectedHash === proofHash;
}
// -----------------------------------------------
// VAULT PROOF REGISTRY
// -----------------------------------------------

interface ProofRecord {
  identityId: string;
  templateId: string;
  proofHash: string;
  issuedAt: string;
}

const proofRegistry: ProofRecord[] = [];

export function registerProofInVault(proof: ProofRecord): void {
  proofRegistry.push(proof);
}

export function listProofsForIdentityFromVault(identityId: string): ProofRecord[] {
  return proofRegistry.filter((p) => p.identityId === identityId);
}
