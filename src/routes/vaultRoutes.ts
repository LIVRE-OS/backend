// src/routes/vaultRoutes.ts

import { FastifyInstance } from "fastify";

// We use the old internal format for reading the stored identities
import { listProofsForIdentityFromVault } from "../services/proofService";
import { getIdentityFromVault, listIdentitiesFromVault } from "../services/identityService";

// Our public-facing Vault types
import type { VaultIdentityRecord, VaultProofRecord } from "../types/types";

export async function registerVaultRoutes(app: FastifyInstance) {

  // GET /identities
  app.get("/identities", async (req, reply) => {
    const identities = listIdentitiesFromVault(); // internal array

    // Convert internal identities to VaultIdentityRecord
    const result: VaultIdentityRecord[] = identities.map((identity: any) => ({
      id: identity.identityId ?? identity.id,
      createdAt: identity.createdAt,
      commitment: identity.commitment,
      attributes: identity.attributes ?? {},
    }));

    reply.send(result);
  });

  // GET /identities/:id
  app.get<{
    Params: { id: string };
  }>("/identities/:id", async (req, reply) => {
    const { id } = req.params;

    const identity: any = getIdentityFromVault(id);
    if (!identity) {
      return reply.status(404).send({ error: "Identity not found" });
    }

    const result: VaultIdentityRecord = {
      id: identity.identityId ?? identity.id,
      createdAt: identity.createdAt,
      commitment: identity.commitment,
      attributes: identity.attributes ?? {},
    };

    reply.send(result);
  });

  // GET /identities/:id/proofs
  app.get<{
    Params: { id: string };
  }>("/identities/:id/proofs", async (req, reply) => {
    const { id } = req.params;

    const proofs = listProofsForIdentityFromVault(id);

    const result: VaultProofRecord[] = proofs.map((p: any) => ({
      identityId: p.identityId,
      templateId: p.templateId,
      proofHash: p.proofHash,
      issuedAt: p.issuedAt,
      valid: p.valid ?? undefined,
      error: p.error ?? undefined,
    }));

    reply.send(result);
  });

}
