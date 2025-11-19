// src/services/proofService.ts
// MVP deterministic proofs for the Agent/Verifier demos. Not real crypto commitments.
import { createHash } from "crypto";
import { hashBytes } from "../lib/crypto";
import type { ProofRequest, ProofBundle, AttributesPayload } from "../lib/types";
import { getIdentity } from "./identityService";

interface SetAttributesResult {
  identityId: string;
  commitment: string;
  attributesRoot: string;
}

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

  return {
    identityId,
    commitment,
    attributesRoot,
  };
}

// Generate a deterministic proof for (identityId, commitment, templateId)
// Assumes caller already created an identity this session and passes the stored commitment.
export function generateProof(req: ProofRequest): ProofBundle | null {
  const identity = getIdentity(req.identityId);
  if (!identity) {
    return null;
  }

  // Make sure caller isn't lying about the commitment
  if (identity.commitment !== req.commitment) {
    return null;
  }

  const proofHash = createHash("sha256")
    .update(req.identityId)
    .update(req.commitment)
    .update(req.templateId)
    .digest("hex");

  const bundle: ProofBundle = {
    identityId: req.identityId,
    templateId: req.templateId,
    proofHash,
    issuedAt: new Date().toISOString(),
  };

  return bundle;
}

// Verify that the proof bundle matches the stored commitment for the identity
// Used by the Verifier UI to check the payload the Agent produced moments earlier.
export function verifyProof(bundle: ProofBundle): boolean {
  const identity = getIdentity(bundle.identityId);
  if (!identity) return false;

  const recomputed = createHash("sha256")
    .update(bundle.identityId)
    .update(identity.commitment)
    .update(bundle.templateId)
    .digest("hex");

  return recomputed === bundle.proofHash;
}
