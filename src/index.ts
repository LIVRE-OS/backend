// src/index.ts
// Livre Identity Node v0.2 - single Fastify process for the API + static Agent/Verifier UI.
import Fastify from "fastify";
import type { FastifyReply } from "fastify";
import { promises as fs } from "fs";
import path from "path";
import cors from "cors";
import proofRoutes from "./routes/proof";
import identityRoutes from "./routes/identity";
import { SERVER_PORT } from "./config";
import { registerVaultRoutes } from "./routes/vaultRoutes";

const WEBSITE_ROOT = path.resolve(process.cwd(), "website");

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
}

async function replyWithWebsiteFile(
  reply: FastifyReply,
  relativePath: string
): Promise<void> {
  const absolute = path.resolve(WEBSITE_ROOT, relativePath);
  if (!absolute.startsWith(WEBSITE_ROOT)) {
    reply.code(404).send("Not found");
    return;
  }

  try {
    const data = await fs.readFile(absolute);
    reply.header("Cache-Control", "public, max-age=120");
    reply.type(getMimeType(absolute)).send(data);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      reply.code(404).send("Not found");
      return;
    }
    reply.log.error({ err, file: absolute }, "Failed to read static asset");
    reply.code(500).send("Unable to read file");
  }
}

async function buildServer() {
  const server = Fastify({
    logger: true,
  });

  const corsMiddleware = cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  });

  // Allow the Agent/Verifier UIs to call into the API while keeping the single-origin hosting model.
  server.addHook("preHandler", (request, reply, done) => {
    corsMiddleware(request.raw, reply.raw, (err?: Error) => {
      if (err) {
        done(err);
        return;
      }
      done();
    });
  });

  // API routes used by the Agent/Verifier apps.
  server.register(proofRoutes);
  server.register(identityRoutes);
  server.register(registerVaultRoutes);

  server.get("/health", async (_request, _reply) => {
    return { status: "ok" };
  });

  // Static website routes.
  server.get("/", async (_request, reply) => {
    await replyWithWebsiteFile(reply, "index.html");
  });

  server.get("/agent", async (_request, reply) => {
    await replyWithWebsiteFile(reply, "agent.html");
  });

  server.get("/verifier", async (_request, reply) => {
    await replyWithWebsiteFile(reply, "verifier.html");
  });

  server.get("/assets/*", async (request, reply) => {
    const wildcard = (request.params as { "*": string })["*"] ?? "";
    if (!wildcard) {
      reply.code(404).send("Not found");
      return;
    }
    await replyWithWebsiteFile(reply, path.join("assets", wildcard));
  });

  return server;
}

async function start() {
  const server = await buildServer();

  try {
    const port = SERVER_PORT;
    await server.listen({ port, host: "0.0.0.0" });
    console.log(`Livre Identity Node running on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
