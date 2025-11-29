"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIdentity = createIdentity;
exports.getIdentity = getIdentity;
exports.updateAttributesRoot = updateAttributesRoot;
exports.persistIdentityStore = persistIdentityStore;
exports.getIdentityFromVault = getIdentityFromVault;
exports.listIdentitiesFromVault = listIdentitiesFromVault;
// src/services/identityService.ts
// Identity registry backed by the encrypted vault service.
const crypto_1 = require("crypto");
const vault_1 = require("./vault");
const identities = new Map();
const initialState = (0, vault_1.loadVaultState)();
initialState.identities.forEach((record) => {
    identities.set(record.identityId, record);
});
function persistIdentities() {
    (0, vault_1.saveVaultState)({ identities: Array.from(identities.values()) });
}
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
    persistIdentities();
    return record;
}
function getIdentity(id) {
    return identities.get(id);
}
function updateAttributesRoot(identityId, newAttributesRoot) {
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
    persistIdentities();
    return updated;
}
function persistIdentityStore() {
    persistIdentities();
}
// Vault helpers: expose what we already have in `identities`
function getIdentityFromVault(id) {
    return identities.get(id);
}
function listIdentitiesFromVault() {
    return Array.from(identities.values());
}
