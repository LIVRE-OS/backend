// src/routes/proof.ts
// Agent issues proofs via POST /proof; Verifier posts bundles to /proof/verify.

import type { FastifyInstance } from "fastify";
import type {
  ProofRequest,
  ProofBundle,
  ProofVerifyRequest,
} from "../lib/types";
import { generateProof, verifyProof } from "../services/proofService";

export default async function proofRoutes(fastify: FastifyInstance) {
  // -----------------------------------------
  // Generate Proof
  // -----------------------------------------
  fastify.post("/proof", async (request, reply) => {
    const body = request.body as ProofRequest | undefined;

    if (
      !body ||
      typeof body.identityId !== "string" ||
      typeof body.commitment !== "string" ||
      typeof body.templateId !== "string"
    ) {
      reply.code(400);
      return { error: "identityId, commitment, templateId required" };
    }

    const proof = generateProof(body);

    if (!proof) {
      reply.code(400);
      return {
        error:
          "Unable to generate proof (identity not found, commitment mismatch, or attributes do not satisfy the template requirements)",
      };
    }

    return proof;
  });

  // -----------------------------------------
  // Verify Proof
  // -----------------------------------------
  fastify.post("/proof/verify", async (request, reply) => {
    const body = request.body as ProofVerifyRequest | undefined;

    if (!body || typeof body.identityId !== "string" || !body.proof) {
      reply.code(400);
      return { error: "identityId and proof are required" };
    }

    const proof = body.proof as ProofBundle;

    if (
      typeof proof.identityId !== "string" ||
      typeof proof.templateId !== "string" ||
      typeof proof.proofHash !== "string" ||
      typeof proof.issuedAt !== "string"
    ) {
      reply.code(400);
      return { error: "Malformed proof bundle" };
    }

    if (body.identityId !== proof.identityId) {
      reply.code(400);
      return { error: "identityId mismatch between request and proof bundle" };
    }

    const ok = verifyProof({ identityId: body.identityId }, proof);
    return { valid: ok };
  });
} // <-- THIS is the final bracket
