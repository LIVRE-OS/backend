"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
// MVP server wiring for the Agent/Verifier API surface.
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("cors"));
const proof_1 = __importDefault(require("./routes/proof"));
const identity_1 = __importDefault(require("./routes/identity"));
const vault_1 = __importDefault(require("./routes/vault"));
const config_1 = require("./config");
async function buildServer() {
    const server = (0, fastify_1.default)({
        logger: true,
    });
    const corsMiddleware = (0, cors_1.default)({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
    });
    // Allow the Agent/Verifier UIs to call into the API from any origin during the demo.
    server.addHook("preHandler", (request, reply, done) => {
        corsMiddleware(request.raw, reply.raw, (err) => {
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
    server.register(proof_1.default);
    server.register(identity_1.default);
    server.register(vault_1.default);
    server.get("/health", async (_request, _reply) => {
        return { status: "ok" };
    });
    return server;
}
async function start() {
    const server = await buildServer();
    try {
        const port = config_1.SERVER_PORT;
        await server.listen({ port, host: "0.0.0.0" });
        console.log(`Backend running on http://localhost:${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}
start();
