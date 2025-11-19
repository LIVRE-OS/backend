// Global configuration for the backend.
// DEFAULT_TEMPLATE_ID is MVP-only; a template registry will replace it once multiple proofs exist.

export const SERVER_PORT =
  process.env.PORT !== undefined ? Number(process.env.PORT) : 4000;

export const DEFAULT_TEMPLATE_ID = "age_over_18_and_resident_pt";
