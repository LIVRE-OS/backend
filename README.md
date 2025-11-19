## Backend MVP Flow

This backend exposes three Fastify routes that let you create an identity, request a proof for one of the available templates, and verify that proof. All data is stored in memory, so keep the server running while exercising the flow.

### 1. Create an Identity

```
POST /identity
```

Request body: `{}` (optional).  
Response:

```json
{
  "identityId": "string",
  "commitment": "string"
}
```

Sample command:

```powershell
curl -X POST http://localhost:4000/identity
```

Copy both `identityId` and `commitment`; you'll need them for `/proof`.

### 2. Generate a Proof

```
POST /proof
```

Request body:

```json
{
  "identityId": "string",
  "commitment": "string",
  "templateId": "age_over_18_and_resident_pt"
}
```

If the identity exists and the commitment matches the stored value, the server returns a deterministic proof bundle:

```json
{
  "identityId": "string",
  "templateId": "age_over_18_and_resident_pt",
  "proofHash": "string",
  "issuedAt": "2025-11-18T12:07:31.173Z"
}
```

Sample command (replace placeholder values with those from `/identity`):

```powershell
curl -X POST http://localhost:4000/proof ^
  -H "Content-Type: application/json" ^
  -d "{\"identityId\":\"<identityId>\",\"commitment\":\"<commitment>\",\"templateId\":\"age_over_18_and_resident_pt\"}"
```

### 3. Verify a Proof

```
POST /proof/verify
```

Request body:

```json
{
  "identityId": "string",
  "proof": {
    "identityId": "string",
    "templateId": "age_over_18_and_resident_pt",
    "proofHash": "string",
    "issuedAt": "2025-11-18T12:07:31.173Z"
  }
}
```

The `proof` object is exactly what the `/proof` endpoint generated. Response:

```json
{ "valid": true }
```

Sample command:

```powershell
curl -X POST http://localhost:4000/proof/verify ^
  -H "Content-Type: application/json" ^
  -d "{\"identityId\":\"<identityId>\",\"proof\":<proof-json>}"
```

Replace `<proof-json>` with the verbatim JSON object returned by `/proof`. The verifier recomputes the proof hash using the stored commitment and reports whether the provided bundle is valid.
