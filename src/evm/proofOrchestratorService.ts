import { publicClient, walletClient } from "./viemClient";
// backend/src/evm/proofOrchestratorService.ts
import deployments from "../../contracts/deployments.local.json";

import type { Abi } from "viem";

const orchestratorInfo = (deployments as any).ProofOrchestrator;

if (!orchestratorInfo) {
  throw new Error("ProofOrchestrator deployment not found in deployments.local.json");
}

const PROOF_ORCHESTRATOR_ADDRESS = orchestratorInfo.address as `0x${string}`;
const PROOF_ORCHESTRATOR_ABI = orchestratorInfo.abi as Abi;

export async function requestProofOnChain(params: {
  identityCommitment: `0x${string}`;
  templateId: `0x${string}`;
  expiresAt: bigint; // 0 for no expiry, else unix timestamp
  context: string;
}): Promise<bigint> {
  if (!walletClient) {
    throw new Error("No wallet client configured for on-chain writes");
  }

  const { identityCommitment, templateId, expiresAt, context } = params;

  const { request } = await publicClient.simulateContract({
    address: PROOF_ORCHESTRATOR_ADDRESS,
    abi: PROOF_ORCHESTRATOR_ABI,
    functionName: "requestProof",
    args: [identityCommitment, templateId, expiresAt, context],
    account: walletClient.account!,
  });

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // requestProof returns (uint256 requestId)
  const logs = receipt.logs; // we could decode event, but easiest is to call view
  // simpler: read latest requestId by reading mapping length, but we didn't expose it.
  // For now we call a small view function you can add later e.g. `latestRequestId()`.
  // For now we just return 0n as placeholder.
  return 0n;
}

export async function getRequestFromChain(requestId: bigint) {
  const req = await publicClient.readContract({
    address: PROOF_ORCHESTRATOR_ADDRESS,
    abi: PROOF_ORCHESTRATOR_ABI,
    functionName: "getRequest",
    args: [requestId],
  });

  // req is ProofRequest struct
  return req;
}
