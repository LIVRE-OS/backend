// src/types/types.ts

// Core identity shape used for the *Vault* views / external kernel
export interface VaultIdentityRecord {
  id: string;
  createdAt: string;
  commitment: string;
  attributes: Record<string, any>;
  [key: string]: any;
}

// Core proof shape used for the *Vault* / external kernel
export interface VaultProofRecord {
  identityId: string;
  templateId: string;
  proofHash: string;
  issuedAt: string;
  valid?: boolean;
  error?: string;
  [key: string]: any;
}
// Extended identity shape used internally by the backend services