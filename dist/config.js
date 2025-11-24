"use strict";
// Global configuration for the backend.
// DEFAULT_TEMPLATE_ID is MVP-only; a template registry will replace it once multiple proofs exist.
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TEMPLATE_ID = exports.SERVER_PORT = void 0;
exports.SERVER_PORT = process.env.PORT !== undefined ? Number(process.env.PORT) : 4000;
exports.DEFAULT_TEMPLATE_ID = "age_over_18_and_resident_pt";
