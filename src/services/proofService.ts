// src/services/proofService.ts
import { createHash } from "crypto";
import type { ProofRequest, ProofBundle } from "../lib/types";
import { getIdentity } from "./identityService";

// Generate a deterministic proof for (identityId, commitment, templateId)
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
