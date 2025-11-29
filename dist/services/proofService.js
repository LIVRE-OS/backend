"use strict";
// src/services/proofService.ts
// MVP deterministic proofs for the Agent/Verifier demos. Not real crypto commitments.
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAttributes = setAttributes;
exports.generateProof = generateProof;
exports.verifyProof = verifyProof;
exports.registerProofInVault = registerProofInVault;
exports.listProofsForIdentityFromVault = listProofsForIdentityFromVault;
const crypto_1 = require("crypto");
const crypto_2 = require("../lib/crypto");
const identityService_1 = require("./identityService");
const config_1 = require("../config");
// -----------------------------------------------
// Attribute Hashing
// -----------------------------------------------
function hashAttributes(attrs) {
    return (0, crypto_2.hashBytes)(JSON.stringify({
        birthdate: attrs.birthdate,
        country: attrs.country,
    }));
}
function computeCommitment(controlKey, recoveryKey, attributesRoot, policiesRoot) {
    const h = (0, crypto_1.createHash)("sha256");
    h.update(controlKey);
    h.update(recoveryKey);
    h.update(attributesRoot);
    h.update(policiesRoot);
    return h.digest("hex");
}
function computeProofHash({ identityId, templateId, commitment, attributesRoot, }) {
    const root = attributesRoot ?? "";
    return (0, crypto_1.createHash)("sha256")
        .update(identityId)
        .update(templateId)
        .update(commitment)
        .update(root)
        .digest("hex");
}
// -----------------------------------------------
// Birthdate parsing & age
// -----------------------------------------------
function parseBirthdate(value) {
    const [year, month, day] = value.split("-").map((n) => Number(n));
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
        return null;
    }
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.getUTCFullYear() === year &&
        d.getUTCMonth() + 1 === month &&
        d.getUTCDate() === day
        ? d
        : null;
}
function calculateAge(birthdate, now) {
    let age = now.getUTCFullYear() - birthdate.getUTCFullYear();
    const m = now.getUTCMonth() - birthdate.getUTCMonth();
    if (m < 0 || (m === 0 && now.getUTCDate() < birthdate.getUTCDate())) {
        age--;
    }
    return age;
}
// -----------------------------------------------
// Template Enforcement
// -----------------------------------------------
function attributesMeetTemplateRequirements(identity, templateId) {
    const attrs = identity.attributes;
    if (!attrs || !attrs.birthdate || !attrs.country) {
        return false;
    }
    const parsedBirthdate = parseBirthdate(attrs.birthdate);
    if (!parsedBirthdate)
        return false;
    const age = calculateAge(parsedBirthdate, new Date());
    const country = attrs.country.toUpperCase();
    switch (templateId) {
        case config_1.DEFAULT_TEMPLATE_ID:
            return age >= 18 && country === "PT";
        default:
            return false;
    }
}
// -----------------------------------------------
// Attribute Setter
// -----------------------------------------------
function setAttributes(identityId, attrs) {
    const identity = (0, identityService_1.getIdentity)(identityId);
    if (!identity) {
        throw new Error("Identity not found");
    }
    const attributesRoot = hashAttributes(attrs);
    const commitment = computeCommitment(identity.controlKey, identity.recoveryKey, attributesRoot, identity.policiesRoot);
    identity.attributes = {
        birthdate: attrs.birthdate,
        country: attrs.country,
    };
    identity.attributesRoot = attributesRoot;
    identity.commitment = commitment;
    (0, identityService_1.persistIdentityStore)();
    return { identityId, commitment, attributesRoot };
}
// -----------------------------------------------
// Proof Generation
// -----------------------------------------------
function generateProof(req) {
    const identity = (0, identityService_1.getIdentity)(req.identityId);
    if (!identity) {
        return null;
    }
    if (identity.commitment !== req.commitment) {
        return null;
    }
    if (!attributesMeetTemplateRequirements(identity, req.templateId)) {
        return null;
    }
    const proofHash = computeProofHash({
        identityId: req.identityId,
        templateId: req.templateId,
        commitment: identity.commitment,
        attributesRoot: identity.attributesRoot,
    });
    const proof = {
        identityId: req.identityId,
        templateId: req.templateId,
        proofHash,
        issuedAt: new Date().toISOString(),
    };
    // store for Vault view
    registerProofInVault({
        identityId: proof.identityId,
        templateId: proof.templateId,
        proofHash: proof.proofHash,
        issuedAt: proof.issuedAt,
    });
    return proof;
}
// -----------------------------------------------
// PROOF VERIFICATION
// -----------------------------------------------
function verifyProof(identityPayload, bundle) {
    const { identityId } = identityPayload;
    const { templateId, proofHash } = bundle;
    // 1. Identity in payload must match identity in proof
    if (identityId !== bundle.identityId) {
        return false;
    }
    // 2. Load stored identity
    const stored = (0, identityService_1.getIdentity)(identityId);
    if (!stored) {
        return false;
    }
    // 3. Check that stored attributes satisfy the template
    if (!attributesMeetTemplateRequirements(stored, templateId)) {
        return false;
    }
    // 4. Ensure we have an attributesRoot for this identity
    let attributesRoot = stored.attributesRoot;
    if (!attributesRoot && stored.attributes) {
        // recompute using the same logic as setAttributes()
        attributesRoot = hashAttributes(stored.attributes);
        stored.attributesRoot = attributesRoot;
        (0, identityService_1.persistIdentityStore)();
    }
    if (!attributesRoot) {
        return false;
    }
    // 5. Recompute the expected proof hash from stored values
    const expectedHash = computeProofHash({
        identityId: stored.identityId,
        templateId,
        commitment: stored.commitment,
        attributesRoot,
    });
    // 6. Final decision
    return expectedHash === proofHash;
}
const proofRegistry = [];
function registerProofInVault(proof) {
    proofRegistry.push(proof);
}
function listProofsForIdentityFromVault(identityId) {
    return proofRegistry.filter((p) => p.identityId === identityId);
}
