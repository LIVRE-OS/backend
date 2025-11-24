"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAttributes = setAttributes;
exports.generateProof = generateProof;
exports.verifyProof = verifyProof;
// src/services/proofService.ts
// MVP deterministic proofs for the Agent/Verifier demos. Not real crypto commitments.
const crypto_1 = require("crypto");
const crypto_2 = require("../lib/crypto");
const identityService_1 = require("./identityService");
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
    return {
        identityId,
        commitment,
        attributesRoot,
    };
}
// Generate a deterministic proof for (identityId, commitment, templateId)
// Assumes caller already created an identity this session and passes the stored commitment.
function generateProof(req) {
    const identity = (0, identityService_1.getIdentity)(req.identityId);
    if (!identity) {
        return null;
    }
    // Make sure caller isn't lying about the commitment
    if (identity.commitment !== req.commitment) {
        return null;
    }
    const proofHash = (0, crypto_1.createHash)("sha256")
        .update(req.identityId)
        .update(req.commitment)
        .update(req.templateId)
        .digest("hex");
    const bundle = {
        identityId: req.identityId,
        templateId: req.templateId,
        proofHash,
        issuedAt: new Date().toISOString(),
    };
    return bundle;
}
// Verify that the proof bundle matches the stored commitment for the identity
// Used by the Verifier UI to check the payload the Agent produced moments earlier.
function verifyProof(bundle) {
    const identity = (0, identityService_1.getIdentity)(bundle.identityId);
    if (!identity)
        return false;
    const recomputed = (0, crypto_1.createHash)("sha256")
        .update(bundle.identityId)
        .update(identity.commitment)
        .update(bundle.templateId)
        .digest("hex");
    return recomputed === bundle.proofHash;
}
