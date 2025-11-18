// src/routes/vault.ts
import { FastifyInstance } from "fastify";
import { storeAttributes } from "../services/vaultService";
import { updateAttributesRoot, getIdentity } from "../services/identityService";
import type { AttributesPayload } from "../lib/types";

export default async function vaultRoutes(fastify: FastifyInstance) {
  fastify.post("/vault/:identityId/attributes", async (request, reply) => {
    const { identityId } = request.params as { identityId: string };
    const identity = getIdentity(identityId);
    if (!identity) {
      reply.code(404);
      return { error: "Identity not found" };
    }

    const body = request.body as Partial<AttributesPayload>;
    if (!body.birthdate || !body.country) {
      reply.code(400);
      return { error: "birthdate and country are required" };
    }

    const stored = storeAttributes(identityId, {
      birthdate: body.birthdate,
      country: body.country,
    });

    const updated = updateAttributesRoot(identityId, stored.attributesRoot);
    if (!updated) {
      reply.code(500);
      return { error: "Failed to update identity" };
    }

    return {
      identityId: updated.identityId,
      commitment: updated.commitment,
      attributesRoot: updated.attributesRoot,
    };
  });
}
