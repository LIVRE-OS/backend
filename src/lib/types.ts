// src/lib/types.ts

// What we store for each identity (in-memory for now)
export interface IdentityRecord {
  identityId: string;
  commitment: string;
  attributesRoot: string;
  createdAt: string;
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
