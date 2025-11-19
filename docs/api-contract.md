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
