// src/agent/demoAgent.ts
import axios from "axios";

const BASE_URL = "http://localhost:4000";

async function run() {
  // 1) Create identity
  const createRes = await axios.post(`${BASE_URL}/identity`);
  const identityId = createRes.data.identityId;
  console.log("Created identity:", identityId);

  // 2) Request an over-18 proof
  const proofRes = await axios.post(`${BASE_URL}/proofs/over-18`, {
    identityId,
  });

  console.log("Proof result:", proofRes.data);
}

run().catch((err) => {
  console.error("Agent error:", err.message);
});
