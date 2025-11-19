// src/routes/identity.ts
// MVP: identity endpoints used by the Agent UI to bootstrap Age Proof demos.
import type { FastifyInstance } from "fastify";
import { createIdentity, getIdentity } from "../services/identityService";
import { setAttributes } from "../services/proofService";
import type {
  AttributesPayload,
  IdentityCreateResponse,
} from "../lib/types";

export default async function identityRoutes(fastify: FastifyInstance) {
  // Agent flow: create an identity before requesting proofs.
  // WARNING: identities live in memory only; restart wipes them.
  fastify.post("/identity", async (request, reply) => {
    // MVP: optional body validation placeholder until metadata is supported.
    const body = request.body as Record<string, unknown> | undefined;
    if (body && typeof body !== "object") {
      reply.code(400);
      return { error: "Body, when provided, must be a JSON object" };
    }

    const record = createIdentity();
    const response: IdentityCreateResponse = {
      identityId: record.identityId,
      commitment: record.commitment,
    };
    return response;
  });

  // Internal tooling: inspect an identity while the server is running.
  fastify.get("/identity/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = getIdentity(id);
    if (!record) {
      reply.code(404);
      return { error: "Identity not found" };
    }
    return {
      identityId: record.identityId,
      commitment: record.commitment,
      attributesRoot: record.attributesRoot,
      createdAt: record.createdAt,
    };
  });

  const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  const COUNTRY_REGEX = /^[A-Z]{2}$/;

  function validateBirthdate(value: string): string | null {
    if (!DATE_REGEX.test(value)) {
      return "Invalid birthdate format, expected YYYY-MM-DD";
    }
    const [yearStr, monthStr, dayStr] = value.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() + 1 !== month ||
      date.getUTCDate() !== day
    ) {
      return "Birthdate must be a valid calendar date";
    }
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    if (date > today) {
      return "Birthdate cannot be in the future";
    }
    const minYear = today.getUTCFullYear() - 150;
    const minDate = new Date(
      Date.UTC(minYear, today.getUTCMonth(), today.getUTCDate())
    );
    if (date < minDate) {
      return "Birthdate must represent an age under 150";
    }
    return null;
  }

  function validateCountry(value: string): string | null {
    if (!COUNTRY_REGEX.test(value)) {
      return "Country must be a 2-letter ISO code (e.g. PT)";
    }
    return null;
  }

  fastify.post("/attributes", async (request, reply) => {
    const body = request.body as (Partial<AttributesPayload> & {
      identityId?: string;
    }) | null;

    if (!body || typeof body !== "object") {
      reply.code(400);
      return { error: "identityId, birthdate, and country are required" };
    }

    const { identityId, birthdate, country } = body;
    if (!identityId || typeof identityId !== "string") {
      reply.code(400);
      return { error: "identityId is required" };
    }

    if (typeof birthdate !== "string") {
      reply.code(400);
      return { error: "birthdate must be provided as a string" };
    }
    if (typeof country !== "string") {
      reply.code(400);
      return { error: "country must be provided as a string" };
    }

    const birthdateError = validateBirthdate(birthdate);
    if (birthdateError) {
      reply.code(400);
      return { error: birthdateError };
    }

    const countryError = validateCountry(country);
    if (countryError) {
      reply.code(400);
      return { error: countryError };
    }

    if (!getIdentity(identityId)) {
      reply.code(404);
      return { error: `Identity ${identityId} not found` };
    }

    try {
      const updated = setAttributes(identityId, { birthdate, country });
      return updated;
    } catch (err) {
      request.log.error({ err }, "Failed to set attributes");
      reply.code(400);
      return {
        error:
          err instanceof Error ? err.message : "Failed to set attributes",
      };
    }
  });
}
