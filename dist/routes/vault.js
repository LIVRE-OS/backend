"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = vaultRoutes;
const vaultService_1 = require("../services/vaultService");
const identityService_1 = require("../services/identityService");
async function vaultRoutes(fastify) {
    fastify.post("/vault/:identityId/attributes", async (request, reply) => {
        const { identityId } = request.params;
        const identity = (0, identityService_1.getIdentity)(identityId);
        if (!identity) {
            reply.code(404);
            return { error: "Identity not found" };
        }
        const body = request.body;
        if (!body.birthdate || !body.country) {
            reply.code(400);
            return { error: "birthdate and country are required" };
        }
        const stored = (0, vaultService_1.storeAttributes)(identityId, {
            birthdate: body.birthdate,
            country: body.country,
        });
        const updated = (0, identityService_1.updateAttributesRoot)(identityId, stored.attributesRoot);
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
