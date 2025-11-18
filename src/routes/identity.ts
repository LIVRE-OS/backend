// src/routes/identity.ts
import { FastifyInstance } from "fastify";
import { createIdentity, getIdentity } from "../services/identityService";

export default async function identityRoutes(fastify: FastifyInstance) {
  fastify.post("/identity", async (_request, _reply) => {
    const record = createIdentity();
    return {
      identityId: record.identityId,
      commitment: record.commitment,
    };
  });

  fastify.get("/identity/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = getIdentity(id);
    if (!record) {
      reply.code(404);
      return { error: "Identity not found" };
    }
    return {
      identityId: record.identityId,
      commitment: record.commitment,
      attributesRoot: record.attributesRoot,
      createdAt: record.createdAt,
    };
  });
}
