## API Contract

All endpoints accept and return JSON. Set `Content-Type: application/json` for requests with bodies. The backend stores data in memory, so identities exist only for the lifetime of the running process.

---

### `POST /identity`

Create a new identity and commitment pair.

**Request Body**

```json
{}
```

The body can be omitted or sent as `{}`; additional fields are ignored.

**Response**

```json
{
  "identityId": "0f5b2e9d34cb49b2ac62e98fb97df30a",
  "commitment": "31e6f54cefd2c1e178777f318e0c89209e42d9945f934d5a264de8f8999dbe4d"
}
```

Status: `200 OK`

---

### `POST /attributes`

Attach birthdate and country metadata to an existing identity. Updates the stored `attributesRoot` and recalculates the commitment.

**Request Body**

```json
{
  "identityId": "0f5b2e9d34cb49b2ac62e98fb97df30a",
  "birthdate": "1990-01-01",
  "country": "PT"
}
```

All three fields are required strings. `birthdate` must match `YYYY-MM-DD`, be a valid calendar date, and not be in the future. `country` must be a two-letter uppercase ISO code.

**Successful Response**

```json
{
  "identityId": "0f5b2e9d34cb49b2ac62e98fb97df30a",
  "commitment": "31e6f54cefd2c1e178777f318e0c89209e42d9945f934d5a264de8f8999dbe4d",
  "attributesRoot": "8c58f4ae9f86d87e2d860b02079de4b32bc413fc3bc533acf9fd2fb736f149fb"
}
```

Status: `200 OK`

**Failure Scenarios**

- Missing or malformed fields:

  ```json
  { "error": "identityId, birthdate, and country are required" }
  ```

- Invalid birthdate or future date:

  ```json
  { "error": "Invalid birthdate format, expected YYYY-MM-DD" }
  ```

- Invalid country code:

  ```json
  { "error": "Country must be a 2-letter ISO code (e.g. PT)" }
  ```

- Unknown identity:

  ```json
  { "error": "Identity 123 not found" }
  ```

Status: `400 Bad Request` for validation errors, `404 Not Found` when the identity is missing.

---

### `POST /proof`

Generate a deterministic proof for an existing identity.

**Request Body**

```json
{
  "identityId": "0f5b2e9d34cb49b2ac62e98fb97df30a",
  "commitment": "31e6f54cefd2c1e178777f318e0c89209e42d9945f934d5a264de8f8999dbe4d",
  "templateId": "age_over_18_and_resident_pt"
}
```

All three fields are required and must be strings.

**Successful Response**

```json
{
  "identityId": "0f5b2e9d34cb49b2ac62e98fb97df30a",
  "templateId": "age_over_18_and_resident_pt",
  "proofHash": "c2b6b9a52d62d57b0f9d2cb9e34e8f0b4bbf57440c90a8d05df14baf1bfa6e0d",
  "issuedAt": "2025-11-18T12:07:31.173Z"
}
```

Status: `200 OK`

**Proof Hash Derivation**

`proofHash` is a deterministic SHA-256 digest of:

```
identityId + templateId + stored commitment + stored attributesRoot (empty string if undefined)
```

This binds the proof to the exact identity data held in the vault, so swapping identities or commitments invalidates the proof.

Issuing a proof also requires the stored attributes to satisfy the requested template. For the default `age_over_18_and_resident_pt` template, the identity must have `birthdate` + `country` attributes set, the computed age must be ≥ 18, and the country must equal `PT`.

**Error Response**

```json
{
  "error": "identityId, commitment, templateId required"
}
```

Status: `400 Bad Request`

Identity lookup or commitment mismatches also return `400` with:

```json
{
  "error": "Unable to generate proof (identity not found or commitment mismatch)"
}
```

---

### `POST /proof/verify`

Validate a proof bundle previously returned by `/proof`.

**Request Body**

```json
{
  "identityId": "0f5b2e9d34cb49b2ac62e98fb97df30a",
  "proof": {
    "identityId": "0f5b2e9d34cb49b2ac62e98fb97df30a",
    "templateId": "age_over_18_and_resident_pt",
    "proofHash": "c2b6b9a52d62d57b0f9d2cb9e34e8f0b4bbf57440c90a8d05df14baf1bfa6e0d",
    "issuedAt": "2025-11-18T12:07:31.173Z"
  }
}
```

The top-level `identityId` must match `proof.identityId`.

**Successful Response**

```json
{ "valid": true }
```

Status: `200 OK`

**Failure Scenarios**

- Missing fields:

  ```json
  { "error": "identityId and proof are required" }
  ```

- Identity mismatch:

  ```json
  { "error": "identityId mismatch between request and proof bundle" }
  ```

`verifyProof` recomputes the deterministic hash using the stored commitment/attributesRoot and re-evaluates the template criteria, so proofs are only valid while the vault still contains attributes that satisfy the claim.
