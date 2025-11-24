"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIdentity = createIdentity;
exports.getIdentity = getIdentity;
exports.updateAttributesRoot = updateAttributesRoot;
// src/services/identityService.ts
// MVP: in-memory identity registry for Age Proof demo. Restarting clears everything.
const crypto_1 = require("crypto");
const identities = new Map();
function randomId() {
    return (0, crypto_1.randomBytes)(16).toString("hex");
}
function makeCommitment(controlKey, recoveryKey, attributesRoot, policiesRoot) {
    const h = (0, crypto_1.createHash)("sha256");
    h.update(controlKey);
    h.update(recoveryKey);
    h.update(attributesRoot);
    h.update(policiesRoot);
    return h.digest("hex");
}
function createIdentity() {
    const identityId = randomId();
    const controlKey = randomId();
    const recoveryKey = randomId();
    const attributesRoot = randomId();
    const policiesRoot = randomId();
    const commitment = makeCommitment(controlKey, recoveryKey, attributesRoot, policiesRoot);
    const record = {
        identityId,
        commitment,
        attributesRoot,
        createdAt: new Date().toISOString(),
        controlKey,
        recoveryKey,
        policiesRoot,
    };
    identities.set(identityId, record);
    return record;
}
function getIdentity(id) {
    return identities.get(id);
}
function updateAttributesRoot(identityId, newAttributesRoot) {
    // Placeholder: vault service calls this after synthetic attribute updates.
    const record = identities.get(identityId);
    if (!record) {
        return null;
    }
    const commitment = makeCommitment(record.controlKey, record.recoveryKey, newAttributesRoot, record.policiesRoot);
    const updated = {
        ...record,
        attributesRoot: newAttributesRoot,
        commitment,
    };
    identities.set(identityId, updated);
    return updated;
}
