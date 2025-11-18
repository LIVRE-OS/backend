// src/routes/proof.ts
import type { FastifyInstance } from "fastify";
import type { ProofRequest, ProofBundle } from "../lib/types";
import { generateProof, verifyProof } from "../services/proofService";

export default async function proofRoutes(fastify: FastifyInstance) {
  // Generate proof for an identity + template
  fastify.post("/proof", async (request, reply) => {
    const body = request.body as ProofRequest | undefined;

    if (!body || !body.identityId || !body.commitment || !body.templateId) {
      reply.code(400);
      return { error: "identityId, commitment, templateId required" };
    }

    const proof = generateProof(body);

    if (!proof) {
      reply.code(400);
      return {
        error:
          "Unable to generate proof (identity not found or commitment mismatch)",
      };
    }

    return proof;
  });

  // Verify proof bundle against the stored identity + commitment
  fastify.post("/proof/verify", async (request, reply) => {
    const body = request.body as
      | { proof: ProofBundle; commitment: string }
      | undefined;

    if (!body || !body.proof || !body.commitment) {
      reply.code(400);
      return { error: "proof and commitment required" };
    }

    const ok = verifyProof(body.proof, body.commitment);
    return { valid: ok };
  });
}
