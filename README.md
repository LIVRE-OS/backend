# LIVRE OS - Livre Identity Node v0.2

Livre Identity Node v0.2 is a minimal identity + proof engine that now serves both the REST API and the Agent/Verifier website from a single Fastify server. Use it to:

- Create a local identity
- Attach attributes (e.g. birthdate, country)
- Generate a proof for a given template
- Verify that a proof is valid for a given identity

It is intentionally simple and framework-light - a kernel that can be extended into a full sovereign identity layer.

---

## ✨ Features (MVP 0.1)

- `POST /identity` – create a new identity with a random identifier and commitment
- `POST /attributes` – attach/update attributes (e.g. birthdate, country) for an existing identity
- `POST /proof` – generate a proof bundle for a given template
- `POST /proof/verify` – verify that a proof bundle is valid for a given identity
- `/`, `/agent`, `/verifier`, `/assets/...` - serve the Agent + Verifier UI from the same Fastify process
- Proof issuance/verification replays the template logic (age >= 18 and resident in PT for the default rite) against the attributes sealed in the vault.

Current proof template:

- `age_over_18_and_resident_pt` – currently used as an example template ID  
  (MVP focuses on the **consistency** of identity + attributes + proof; semantic checks like “18+” / “PT” will come in later phases.)

Identity data is stored in data/vault.json.enc using AES-256-GCM encryption derived from VAULT_PASSPHRASE, so identities survive restarts (delete the file to reset the node).

### Running Livre Identity Node locally

1. Install dependencies: `npm install`
2. Export a vault key (recommended): `set VAULT_PASSPHRASE=choose-a-strong-passphrase`
3. Start the dev server: `npm run dev` (production: `npm run build && npm start`)
4. Visit `http://localhost:4000/` for `/` (home), `/agent`, and `/verifier`.

See `docs/deployment.md` for more deployment notes.

---

## 🧱 Architecture Overview

The backend is structured as:

```text
src/
  index.ts            # Fastify server and route registration
  config.ts           # Basic config (ports, CORS, etc.)
  lib/
    types.ts          # Core TypeScript types for Identity, Proof, Attributes
  routes/
    identity.ts       # /identity and /attributes endpoints
    proof.ts          # /proof and /proof/verify endpoints
  services/
    identityService.ts  # Identity creation + attribute updates
    proofService.ts     # Proof generation + proof verification
  types/
    cors.d.ts         # Type definition to help with CORS lib typing
docs/
  architecture.md     # High level architecture and flow
  api-contract.md     # Endpoint contracts (request/response examples)
  identity-spec-v0.1.md  # (new) Identity & proof JSON format spec
run-local.md          # How to run the backend locally

Fastify is used as the HTTP server; everything else is plain TypeScript.

For a deeper explanation of flows and responsibilities, see:

docs/architecture.md

docs/api-contract.md

docs/identity-spec-v0.1.md

🚀 Getting Started (Local Dev)
```python
1. Install dependencies
npm install
```

2. Run in dev mode (with ts-node-dev)
npm run dev


The backend will start (by default) on:

http://localhost:4000

3. Build + run (production style)
npm run build
npm start

📡 API Endpoints (MVP)
POST /identity

Create a new identity with a fresh identifier and commitment.

Response:

{
  "identityId": "5cdb2ddc8263f042d8fccf32280e2795",
  "commitment": "70823fd4acb455b8d3a4b962782ad787b72d9b7360e7dc15d7a94a0265f118fa"
}

POST /attributes

Attach or update attributes for an existing identity.

In MVP 0.1, attributes include: birthdate (YYYY-MM-DD) and country (ISO 2-letter code).

Request:

{
  "identityId": "5cdb2ddc8263f042d8fccf32280e2795",
  "birthdate": "1999-11-11",
  "country": "PT"
}


Response:

{
  "identityId": "5cdb2ddc8263f042d8fccf32280e2795",
  "commitment": "e6eaa881d38e434bbeee403eeb8abe68180c181593f6877ee56e467f6dfb43e4",
  "attributesRoot": "2d87b162fa421ad6265685ce099847000cb1514414e0f3f02e315e12c5fcb72a"
}


The commitment and attributesRoot reflect the updated internal state for that identity.

POST /proof

Generate a proof bundle for a given identity and template.

Request:

{
  "identityId": "5cdb2ddc8263f042d8fccf32280e2795",
  "templateId": "age_over_18_and_resident_pt"
}


Response:

{
  "identityId": "5cdb2ddc8263f042d8fccf32280e2795",
  "proof": {
    "identityId": "5cdb2ddc8263f042d8fccf32280e2795",
    "templateId": "age_over_18_and_resident_pt",
    "proofHash": "583a8f396a2cf1885738305fc9d1bc510250344771f0d431acfca81540c88a5a",
    "issuedAt": "2025-11-19T03:26:21.985Z"
  }
}


This bundle is what an Agent exports to a Verifier.

POST /proof/verify

Verify that the provided proof bundle is valid for the given identity.

Request:

{
  "identityId": "5cdb2ddc8263f042d8fccf32280e2795",
  "proof": {
    "identityId": "5cdb2ddc8263f042d8fccf32280e2795",
    "templateId": "age_over_18_and_resident_pt",
    "proofHash": "583a8f396a2cf1885738305fc9d1bc510250344771f0d431acfca81540c88a5a",
    "issuedAt": "2025-11-19T03:26:21.985Z"
  }
}


Response:

{ "valid": true }


If any check fails (identity not found, mismatch, missing fields, hash mismatch), the route responds with valid: false or a 400/404 error with a clear message.

🧩 Design Goals

Simplicity first – In-memory storage, minimal surface area.

Deterministic proofs – Same identity + attributes + template → same proofHash.

Extensibility – Easy to add more templates, attributes, or storage backends.

Foundational – Acts as the Layer 1 identity & proof engine for the larger LIVRE OS stack.

🗺 Roadmap (high level)

MVP 0.1 focuses on the identity–proof pair. Next steps include:

Agent Layer (Phase 2)

Multi-identity management

Attribute validation (DOB, country, etc.)

Better UI export for Agent/Verifier

Local vault for identities (encrypted storage)

Template Semantics

Declarative templates (e.g. “age ≥ 18”, “country == PT”)

Enforcing template logic in proof generation

Attestations

Support for third-party issuers signing claims

Attestation objects (issuer, claims, signature, issuedAt)

Persistent Storage

Pluggable backend: file, DB, or wallet-based storage

Integration with Other LIVRE OS Modules

Wallet, permissions, sovereign apps, etc.

🤝 Contributing

Right now this repo is in early design / exploration.
Suggestions, issues, and lightweight PRs are welcome – especially around:

doc clarity

better validation

new proof templates

improved architecture

📜 License

TBD – to be defined once the project structure stabilises.

For now, treat this as exploratory / research code.
