## Backend Architecture Overview

Livre Identity Node v0.2 exposes the REST API and the Agent/Verifier website from a single Fastify server. The same process issues deterministic proofs, verifies bundles, and serves the static assets under `website/`.

- **Agent UI** (`website/agent.html` + assets) - creates identities, manages multiple personas via an in-memory list on the frontend, validates birthdate/country inputs, saves attributes, and generates proofs for the active identity.
- **Verifier UI** (`website/verifier.html`) - accepts `{ identityId, proof }` bundles exported from the Agent and calls `/proof/verify` to confirm validity.

### Key Modules

- `src/index.ts` - Entry point that builds Fastify, wires CORS, registers API routes, and serves `/`, `/agent`, `/verifier`, and `/assets/...` from the `website/` directory.
- `src/routes/identity.ts` - Declares `/identity` and `/attributes`. Creating an identity generates control/recovery keys plus commitments; posting attributes validates birthdate/country and updates the commitment.
- `src/routes/proof.ts` - Declares `/proof` (issue) and `/proof/verify` (validate). Both reuse the in-memory identity cache that mirrors the vault.
- `src/services/vault.ts` - Minimal AES-256-GCM vault that persists identity records to `data/vault.json.enc` using `VAULT_PASSPHRASE`.
- `src/services/identityService.ts` - Loads all identity records from the vault at startup, keeps them in a `Map` for fast lookups, and writes every change (create/update) back to the encrypted vault.
- `src/services/proofService.ts` - Provides `generateProof`, `verifyProof`, and `setAttributes`. Proof issuance hashes `(identityId, templateId, commitment, attributesRoot)` so the `proofHash` is bound to the exact vault record, and it enforces template rules (age ≥ 18 & country PT for the default template) before minting proofs; verification recomputes the hash and re-checks the same attribute logic; attribute updates hash the birthdate/country pair, recompute the commitment, and persist via the vault.

### Storage Model

- Records are cached in module-level maps for fast runtime lookups but are persisted to `data/vault.json.enc`.
- AES-256-GCM encryption keys are derived from `VAULT_PASSPHRASE` (defaults to a development value if not provided, with a console warning).
- Deleting `data/vault.json.enc` resets the node; otherwise identities survive restarts.

### Relationship to the Website

- The `website/` directory is served directly by the backend. Visiting `/`, `/agent`, or `/verifier` loads the Agent/Verifier experiences without needing an additional static host.
- Agent/Verifier JavaScript uses relative API paths (e.g., `fetch('/identity')`), so no extra CORS configuration is necessary when using the bundled server.
- Frontend validation mirrors backend rules: birthdates must match `YYYY-MM-DD`, represent a real calendar date that is not in the future (and under 150 years old), and countries must be two uppercase letters. Invalid inputs are blocked client-side and still rejected server-side if they slip through.
