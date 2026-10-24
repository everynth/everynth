"use client";

import { ComputeBudgetProgram, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { OnlinePumpSdk } from "@pump-fun/pump-sdk";
import { useState } from "react";
import { useWalletCtx } from "@/components/wallet";
import type { PairId } from "@/lib/launchpad";
import { chainOf } from "@/lib/mint";
import { buyInstructions, quoteFor, sellInstructions } from "@/lib/pump";
import { priorityFee, sendAndConfirm } from "@/lib/send";

type Props = { ticker: string; creatorFee: number; mint: string | null; rpc: string; live: boolean; pair: PairId; fees?: { protocolBps: number; creatorBps: number } | null };

/**
 * The buy/sell panel, against pump.fun's bonding curve. On a SOL pair a buy is
 * `buy_exact_quote_in_v3` and a sell `sell_v3`; on an EVYN pair both are one multi-hop swap
 * through EVYN, so the trader only ever holds SOL and the coin. Quotes come from the SDK; 1%
 * slippage. Before the coin is launched there is no curve, and the panel says so.
 */
export function Swap({ ticker, mint, rpc, live, pair, fees }: Props) {
  const pct = (bps: number) => `${(bps / 100).toFixed(2)}%`;
  const rate = fees ? `${pct(fees.protocolBps + fees.creatorBps)} per trade (${pct(fees.protocolBps)} protocol + ${pct(fees.creatorBps)} creator)` : "protocol fee + creator fee, pump.fun's rate";
  const { wallets, address, connect, signTransaction } = useWalletCtx();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amt, setAmt] = useState("");
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const buy = side === "buy";
  const amount = Number(amt) || 0;

  async function swap() {
    setNote("");
    try {
      if (!mint) throw new Error("Not launched yet");
      if (!address) { const w = wallets[0]; if (!w) throw new Error("No Solana wallet found — install Phantom or Solflare"); await connect(w); return; }
      if (amount <= 0) throw new Error(buy ? "Enter how much SOL to spend" : `Enter how many $${ticker} to sell`);
      setStatus("Quoting…");
      const connection = new Connection(rpc, "confirmed");
      const sdk = new OnlinePumpSdk(connection);
      const user = new PublicKey(address), mintPk = new PublicKey(mint);
      const [global, feeConfig, quote] = await Promise.all([sdk.fetchGlobal(), sdk.fetchFeeConfig(), quoteFor(sdk, pair)]);
      const ixs = buy
        ? await buyInstructions({ sdk, global, feeConfig, mint: mintPk, user, sol: amount, quote })
        : await sellInstructions({ sdk, global, feeConfig, mint: mintPk, user, tokens: amount, quote });
      const latest = await connection.getLatestBlockhash();
      const tx = new Transaction({ feePayer: user, ...latest }).add(ComputeBudgetProgram.setComputeUnitLimit({ units: pair === "evyn" ? 600_000 : 300_000 }), priorityFee(), ...ixs);
      setStatus("Approve in your wallet…");
      const signed = await signTransaction(tx.serialize({ requireAllSignatures: false, verifySignatures: false }), chainOf(rpc));
      setStatus(buy ? "Buying…" : "Selling…");
      const signature = await sendAndConfirm(connection, signed, latest);
      setNote(`${buy ? "Bought" : "Sold"} · ${signature.slice(0, 8)}… — reload to see the curve move.`);
      setAmt("");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Swap failed");
    } finally {
      setStatus("");
    }
  }

  const label = status || (!live ? `${buy ? "BUY" : "SELL"} · opens at launch` : !address ? "Connect wallet" : buy ? `BUY $${ticker}` : `SELL $${ticker}`);
  return (
    <div className="sw" id="swap">
      <div className="sw-tabs">
        <button type="button" className={buy ? "on" : ""} onClick={() => setSide("buy")}>BUY</button>
        <button type="button" className={!buy ? "on sell" : ""} onClick={() => setSide("sell")}>SELL</button>
      </div>
      <div className="sw-row"><span className="sw-chip">{address ? `${address.slice(0, 4)}…${address.slice(-4)}` : "no wallet"}</span><span className="sw-chip">{pair === "evyn" ? "via EVYN · " : ""}slippage 1%</span></div>
      <label className="sw-in">
        <input inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, "").slice(0, 12))} placeholder={buy ? "Amount of SOL" : `Amount of $${ticker}`} aria-label={buy ? "Amount of SOL" : `Amount of ${ticker}`} />
        <b>{buy ? "SOL" : `$${ticker}`}</b>
      </label>
      <div className="sw-quick">
        {(buy ? ["0.01", "0.05", "0.1", "0.5"] : ["1000", "10000", "100000"]).map((q) => <button key={q} type="button" onClick={() => setAmt(q)}>{q}{buy ? " SOL" : ""}</button>)}
      </div>
      <button type="button" className={`sw-btn${buy ? "" : " sell"}`} disabled={!live || !!status} onClick={swap}>{label}</button>
      <p className="sw-note">
        {note || (live
          ? pair === "evyn"
            ? `Paired with EVYN: your SOL buys EVYN, which buys $${ticker}, in one transaction. Fee ${rate}. Creator fees land in the EVERYNTH vault in EVYN — half burned, the rest runs the mechanics. Nothing to the launcher.`
            : `pump.fun's curve, fee ${rate}. The creator fee goes to the EVERYNTH vault in full and runs the mechanics; nothing to the launcher. Price moves with every trade.`
          : "No curve yet, so no price. The panel goes live the moment the coin is launched on pump.fun.")}
      </p>
    </div>
  );
}
