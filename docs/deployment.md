# Livre Identity Node Deployment Guide

## Prerequisites

- Node.js 18+
- npm 9+
- A passphrase for the vault (`VAULT_PASSPHRASE`) – optional for local demos but strongly recommended.

## Run Locally

```bash
npm install
set VAULT_PASSPHRASE=choose-a-strong-passphrase  # PowerShell / cmd example
npm run dev
# production-style
npm run build && npm start
```

The server listens on `http://localhost:4000` by default and serves:

- `/identity`, `/attributes`, `/proof`, `/proof/verify` – REST API
- `/` – landing page with quick links
- `/agent` – Agent UI
- `/verifier` – Verifier UI
- `/assets/...` – Shared CSS/JS assets

## Vault

- Data file: `data/vault.json.enc`
- Encryption: AES-256-GCM with keys derived from `VAULT_PASSPHRASE` using `scrypt`.
- Missing passphrase: the node logs a warning and uses a baked-in development key.
- Resetting state: stop the server, delete `data/vault.json.enc`, restart the node.

## Environment Variables

- `PORT` – override the HTTP port (default: `4000`).
- `VAULT_PASSPHRASE` – passphrase used to derive the encryption key.

## Production Notes

- Place the `data/` directory on persistent storage with appropriate permissions.
- Rotate `VAULT_PASSPHRASE` by decrypting with the old value, re-encrypting with the new one (not automated yet).
- Front the node with HTTPS (Fastify still binds to HTTP; terminate TLS at your proxy/load balancer).
