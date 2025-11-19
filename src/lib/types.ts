// src/lib/types.ts
import type { EncryptedBlob } from "./crypto";

// What we store for each identity (in-memory for now)
export interface IdentityRecord {
  identityId: string;
  commitment: string;
  attributesRoot: string;
  createdAt: string;
  controlKey: string;
  recoveryKey: string;
  policiesRoot: string;
  attributes?: AttributesPayload;
}

export interface IdentityCreateResponse {
  identityId: string;
  commitment: string;
}

export interface AttributesPayload {
  birthdate: string;
  country: string;
}

export interface StoredAttributes {
  encrypted: EncryptedBlob;
  attributesRoot: string;
}

// Request body for /proof
export interface ProofRequest {
  identityId: string;
  commitment: string;
  templateId: string;
}

// What /proof returns and /proof/verify consumes
export interface ProofBundle {
  identityId: string;
  templateId: string;
  proofHash: string;
  issuedAt: string;
}

export interface ProofVerifyRequest {
  identityId: string;
  proof: ProofBundle;
}
