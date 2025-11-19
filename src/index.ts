// src/index.ts
// MVP server wiring for the Agent/Verifier API surface.
import Fastify from "fastify";
import cors from "cors";
import proofRoutes from "./routes/proof";
import identityRoutes from "./routes/identity";
import vaultRoutes from "./routes/vault";
import { SERVER_PORT } from "./config";

async function buildServer() {
  const server = Fastify({
    logger: true,
  });

  const corsMiddleware = cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  });

  // Allow the Agent/Verifier UIs to call into the API from any origin during the demo.
  server.addHook("preHandler", (request, reply, done) => {
    corsMiddleware(request.raw, reply.raw, (err?: Error) => {
      if (err) {
        done(err);
        return;
      }
      done();
    });
  });

  // Route layout:
  // - identityRoutes: Agent creates identities before issuing proofs.
  // - proofRoutes: Agent requests proofs, Verifier posts bundles for validation.
  // - vaultRoutes: placeholder for attribute storage in the MVP.
  server.register(proofRoutes);
  server.register(identityRoutes);
  server.register(vaultRoutes);

  server.get("/health", async (_request, _reply) => {
    return { status: "ok" };
  });

  return server;
}

async function start() {
  const server = await buildServer();

  try {
    const port = SERVER_PORT;
    await server.listen({ port, host: "0.0.0.0" });
    console.log(`Backend running on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
