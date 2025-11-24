"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashBytes = hashBytes;
exports.randomId = randomId;
exports.encryptJSON = encryptJSON;
exports.decryptJSON = decryptJSON;
const crypto_1 = __importDefault(require("crypto"));
function hashBytes(data) {
    const buf = typeof data === "string" ? Buffer.from(data, "utf8") : data;
    return crypto_1.default.createHash("sha256").update(buf).digest("hex");
}
function randomId(bytes = 16) {
    return crypto_1.default.randomBytes(bytes).toString("hex");
}
const AES_ALGO = "aes-256-gcm";
// For MVP we use a single in-memory key.
// Later: derive per-identity keys.
const MASTER_KEY = crypto_1.default.randomBytes(32);
function encryptJSON(obj) {
    const plaintext = Buffer.from(JSON.stringify(obj), "utf8");
    const nonce = crypto_1.default.randomBytes(12);
    const cipher = crypto_1.default.createCipheriv(AES_ALGO, MASTER_KEY, nonce);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
        ciphertext: ciphertext.toString("base64"),
        nonce: nonce.toString("base64"),
        authTag: authTag.toString("base64"),
    };
}
function decryptJSON(blob) {
    const nonce = Buffer.from(blob.nonce, "base64");
    const ciphertext = Buffer.from(blob.ciphertext, "base64");
    const authTag = Buffer.from(blob.authTag, "base64");
    const decipher = crypto_1.default.createDecipheriv(AES_ALGO, MASTER_KEY, nonce);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(plaintext.toString("utf8"));
}
