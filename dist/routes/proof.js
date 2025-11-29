"use strict";
// src/routes/proof.ts
// Agent issues proofs via POST /proof; Verifier posts bundles to /proof/verify.
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = proofRoutes;
const proofService_1 = require("../services/proofService");
async function proofRoutes(fastify) {
    // -----------------------------------------
    // Generate Proof
    // -----------------------------------------
    fastify.post("/proof", async (request, reply) => {
        const body = request.body;
        if (!body ||
            typeof body.identityId !== "string" ||
            typeof body.commitment !== "string" ||
            typeof body.templateId !== "string") {
            reply.code(400);
            return { error: "identityId, commitment, templateId required" };
        }
        const proof = (0, proofService_1.generateProof)(body);
        if (!proof) {
            reply.code(400);
            return {
                error: "Unable to generate proof (identity not found, commitment mismatch, or attributes do not satisfy the template requirements)",
            };
        }
        return proof;
    });
    // -----------------------------------------
    // Verify Proof
    // -----------------------------------------
    fastify.post("/proof/verify", async (request, reply) => {
        const body = request.body;
        if (!body || typeof body.identityId !== "string" || !body.proof) {
            reply.code(400);
            return { error: "identityId and proof are required" };
        }
        const proof = body.proof;
        if (typeof proof.identityId !== "string" ||
            typeof proof.templateId !== "string" ||
            typeof proof.proofHash !== "string" ||
            typeof proof.issuedAt !== "string") {
            reply.code(400);
            return { error: "Malformed proof bundle" };
        }
        if (body.identityId !== proof.identityId) {
            reply.code(400);
            return { error: "identityId mismatch between request and proof bundle" };
        }
        const ok = (0, proofService_1.verifyProof)({ identityId: body.identityId }, proof);
        return { valid: ok };
    });
} // <-- THIS is the final bracket
