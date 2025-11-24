"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeAttributes = storeAttributes;
exports.getAttributes = getAttributes;
exports.getAttributesRoot = getAttributesRoot;
// src/services/vaultService.ts
const crypto_1 = require("../lib/crypto");
const vault = new Map();
function storeAttributes(identityId, attrs) {
    // Encrypt entire attribute object
    const encrypted = (0, crypto_1.encryptJSON)(attrs);
    // MVP attributesRoot: hash of a deterministic string
    const attributesRoot = (0, crypto_1.hashBytes)(JSON.stringify({
        birthdate: attrs.birthdate,
        country: attrs.country,
    }));
    const stored = {
        encrypted,
        attributesRoot,
    };
    vault.set(identityId, stored);
    return stored;
}
function getAttributes(identityId) {
    const stored = vault.get(identityId);
    if (!stored)
        return null;
    return (0, crypto_1.decryptJSON)(stored.encrypted);
}
function getAttributesRoot(identityId) {
    const stored = vault.get(identityId);
    return stored ? stored.attributesRoot : null;
}
