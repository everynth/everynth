// Sending a signed transaction from the browser the way mainnet needs it: a priority fee on the
// way in, then rebroadcast every two seconds until it confirms or its blockhash dies. A single
// send-and-wait loses transactions on a busy chain — the launchpad's first dev buy went that way.
import { ComputeBudgetProgram, type BlockhashWithExpiryBlockHeight, type Connection } from "@solana/web3.js";

/** Microlamports per compute unit; enough to land in a normal block without overpaying. */
export const PRIORITY_MICROLAMPORTS = 200_000;

export const priorityFee = () => ComputeBudgetProgram.setComputeUnitPrice({ microLamports: PRIORITY_MICROLAMPORTS });

export async function sendAndConfirm(connection: Connection, signed: Uint8Array, latest: BlockhashWithExpiryBlockHeight): Promise<string> {
  const signature = await connection.sendRawTransaction(signed, { maxRetries: 0 });
  for (let i = 0; i < 90; i++) {
    const status = (await connection.getSignatureStatuses([signature])).value[0];
    if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
      if (status.err) throw new Error(`transaction failed on chain: ${JSON.stringify(status.err)}`);
      return signature;
    }
    if ((await connection.getBlockHeight("confirmed")) > latest.lastValidBlockHeight) throw new Error("the transaction expired before it landed — try again");
    await connection.sendRawTransaction(signed, { skipPreflight: true, maxRetries: 0 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("gave up waiting for the transaction to confirm");
}
