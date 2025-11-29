"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
// Livre Identity Node v0.2 - single Fastify process for the API + static Agent/Verifier UI.
const fastify_1 = __importDefault(require("fastify"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const proof_1 = __importDefault(require("./routes/proof"));
const identity_1 = __importDefault(require("./routes/identity"));
const config_1 = require("./config");
const vaultRoutes_1 = require("./routes/vaultRoutes");
const WEBSITE_ROOT = path_1.default.resolve(process.cwd(), "website");
function getMimeType(filePath) {
    const ext = path_1.default.extname(filePath).toLowerCase();
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
async function replyWithWebsiteFile(reply, relativePath) {
    const absolute = path_1.default.resolve(WEBSITE_ROOT, relativePath);
    if (!absolute.startsWith(WEBSITE_ROOT)) {
        reply.code(404).send("Not found");
        return;
    }
    try {
        const data = await fs_1.promises.readFile(absolute);
        reply.header("Cache-Control", "public, max-age=120");
        reply.type(getMimeType(absolute)).send(data);
    }
    catch (err) {
        const code = err.code;
        if (code === "ENOENT") {
            reply.code(404).send("Not found");
            return;
        }
        reply.log.error({ err, file: absolute }, "Failed to read static asset");
        reply.code(500).send("Unable to read file");
    }
}
async function buildServer() {
    const server = (0, fastify_1.default)({
        logger: true,
    });
    const corsMiddleware = (0, cors_1.default)({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
    });
    // Allow the Agent/Verifier UIs to call into the API while keeping the single-origin hosting model.
    server.addHook("preHandler", (request, reply, done) => {
        corsMiddleware(request.raw, reply.raw, (err) => {
            if (err) {
                done(err);
                return;
            }
            done();
        });
    });
    // API routes used by the Agent/Verifier apps.
    server.register(proof_1.default);
    server.register(identity_1.default);
    server.register(vaultRoutes_1.registerVaultRoutes);
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
        const wildcard = request.params["*"] ?? "";
        if (!wildcard) {
            reply.code(404).send("Not found");
            return;
        }
        await replyWithWebsiteFile(reply, path_1.default.join("assets", wildcard));
    });
    return server;
}
async function start() {
    const server = await buildServer();
    try {
        const port = config_1.SERVER_PORT;
        await server.listen({ port, host: "0.0.0.0" });
        console.log(`Livre Identity Node running on http://localhost:${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}
start();
