// src/index.ts
import Fastify from "fastify";
import proofRoutes from "./routes/proof";
import identityRoutes from "./routes/identity";
import vaultRoutes from "./routes/vault";

async function buildServer() {
  const server = Fastify({
    logger: true,
  });

  // Register route modules (no top-level await)
  server.register(proofRoutes);
  server.register(identityRoutes);
  server.register(vaultRoutes);

  // Simple health check
  server.get("/health", async (_request, _reply) => {
    return { status: "ok" };
  });

  return server;
}

async function start() {
  const server = await buildServer();

  try {
    const port = 4000;
    await server.listen({ port, host: "0.0.0.0" });
    console.log(`Backend running on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
