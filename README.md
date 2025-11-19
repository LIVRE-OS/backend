# LIVRE OS – Identity & Proof Backend (MVP 0.1)

This is the first backend for **LIVRE OS**: a minimal identity + proof engine that can be used by any Agent or application to:

- Create a local identity
- Attach attributes (e.g. birthdate, country)
- Generate a proof for a given template
- Verify that a proof is valid for a given identity

It is intentionally simple, in-memory, and framework-light – a **kernel** that can be extended into a full sovereign identity layer.

---

## ✨ Features (MVP 0.1)

- `POST /identity` – create a new identity with a random identifier and commitment
- `POST /attributes` – attach/update attributes (e.g. birthdate, country) for an existing identity
- `POST /proof` – generate a proof bundle for a given template
- `POST /proof/verify` – verify that a proof bundle is valid for a given identity

Current proof template:

- `age_over_18_and_resident_pt` – currently used as an example template ID  
  (MVP focuses on the **consistency** of identity + attributes + proof; semantic checks like “18+” / “PT” will come in later phases.)

All state is stored **in memory only** – each server restart resets identities, attributes and proofs.

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