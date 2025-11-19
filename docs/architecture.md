## Backend Architecture Overview

This backend powers the Solivre/Sovereign Life Wallet MVP by exposing a minimal Fastify API that issues and verifies deterministic proofs for synthetic identities. The API is consumed by two clients:

- **Agent UI** (`website/agent.html` + assets) – creates identities and requests proofs.
- **Verifier UI** (`website/verifier.html`) – accepts `{ identityId, proof }` bundles and calls the backend to validate them.

Until persistence is implemented, all data lives in memory and is cleared whenever the Node.js process restarts.

### Key Modules

- `src/index.ts` – Entry point that builds the Fastify server, installs CORS, registers the route modules, and exposes `/identity`, `/proof`, `/proof/verify`, plus `/health`.
- `src/routes/identity.ts` – Declares the identity routes. `POST /identity` creates a new record (identityId + commitment); `GET /identity/:id` returns the stored commitment and metadata while the process stays alive.
- `src/routes/proof.ts` – Declares the proof issuance (`POST /proof`) and verification (`POST /proof/verify`) endpoints. They validate request bodies, call the proof service, and emit deterministic JSON responses.
- `src/services/identityService.ts` – Implements the in-memory identity registry via a `Map`. Each identity stores control/recovery keys, the current attributes root, and the derived commitment. The map only persists for the current runtime.
- `src/services/proofService.ts` – Provides `generateProof` and `verifyProof`. Proof issuance hashes the tuple `(identityId, commitment, templateId)` to produce a deterministic `proofHash`; verification recomputes the same hash with the stored commitment to confirm integrity.

### In-Memory Storage Model

- Records are stored in module-level maps; they disappear on server restart.
- Commitment values are recomputed whenever attributes change (future templates will plug into that process).
- Because storage is ephemeral, clients must call `/identity` and `/proof` within the same backend session.

### Relationship to the Website

- The `website/` subdirectory contains the static Agent and Verifier experiences. They call the backend endpoints documented below.
- When deploying, point the website’s `BACKEND_URL` (see `website/assets/js/agent.js` and `website/assets/js/verifier.js`) to the hosted Fastify instance so the flows continue to work.
