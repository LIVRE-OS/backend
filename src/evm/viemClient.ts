// backend/src/viemClients.ts
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { localhost } from "viem/chains";

// Hardhat default account 0 (only for LOCAL dev!)
const DEFAULT_PRIVATE_KEY =
  (process.env.LOCAL_NODE_PRIVATE_KEY as `0x${string}`) ??
  ("0xac0974be a0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0"
    .replace(/ /g, "") as `0x${string}`);

const account = privateKeyToAccount(DEFAULT_PRIVATE_KEY);

export const walletClient = createWalletClient({
  chain: localhost,
  account,
  transport: http("http://127.0.0.1:8545"),
});

export const publicClient = createPublicClient({
  chain: localhost,
  transport: http("http://127.0.0.1:8545"),
});
