"use client";

import { getWallets } from "@wallet-standard/app";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Direct Wallet Standard connection: no adapter UI, no iframe, no third-party login.
// Phantom, Solflare, Backpack etc. register themselves on window; we list, connect, sign.

type ConnectFeature = { connect(opts?: { silent?: boolean }): Promise<{ accounts: readonly WalletAccount[] }> };
type DisconnectFeature = { disconnect(): Promise<void> };
type SignMessageFeature = { signMessage(...inputs: { account: WalletAccount; message: Uint8Array }[]): Promise<{ signature: Uint8Array }[]> };
type SignTxFeature = {
  signTransaction(...inputs: { account: WalletAccount; transaction: Uint8Array; chain?: string }[]): Promise<{ signedTransaction: Uint8Array }[]>;
};

export type Ctx = {
  wallets: Wallet[];
  wallet: Wallet | null;
  account: WalletAccount | null;
  address: string | null;
  connect(w: Wallet): Promise<string>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  signTransaction(tx: Uint8Array, chain: string): Promise<Uint8Array>;
};

const WalletCtx = createContext<Ctx | null>(null);
const LAST = "everynth_wallet";
const isSolana = (w: Wallet) =>
  w.chains.some((c) => c.startsWith("solana:")) && "standard:connect" in w.features && "solana:signMessage" in w.features && "solana:signTransaction" in w.features;

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [account, setAccount] = useState<WalletAccount | null>(null);

  useEffect(() => {
    const api = getWallets();
    const refresh = () => setWallets(api.get().filter(isSolana));
    refresh();
    return api.on("register", refresh); // wallets that inject late still show up
  }, []);

  const connect = useCallback(async (w: Wallet) => {
    const { accounts } = await (w.features["standard:connect"] as ConnectFeature).connect();
    const acc = accounts.find((a) => a.chains.some((c) => c.startsWith("solana:"))) ?? accounts[0];
    if (!acc) throw new Error("No Solana account in this wallet");
    setWallet(w);
    setAccount(acc);
    try { localStorage.setItem(LAST, w.name); } catch {}
    return acc.address;
  }, []);

  // Silent reconnect to the wallet used last time, once it has registered.
  useEffect(() => {
    if (wallet) return;
    let last: string | null = null;
    try { last = localStorage.getItem(LAST); } catch {}
    const w = wallets.find((x) => x.name === last);
    if (!w) return;
    (w.features["standard:connect"] as ConnectFeature).connect({ silent: true })
      .then(({ accounts }) => { const acc = accounts[0]; if (acc) { setWallet(w); setAccount(acc); } })
      .catch(() => {});
  }, [wallets, wallet]);

  const value = useMemo<Ctx>(() => ({
    wallets, wallet, account, address: account?.address ?? null, connect,
    async disconnect() {
      try { await (wallet?.features["standard:disconnect"] as DisconnectFeature | undefined)?.disconnect(); } catch {}
      setWallet(null); setAccount(null);
      try { localStorage.removeItem(LAST); } catch {}
    },
    async signMessage(message) {
      if (!wallet || !account) throw new Error("Connect a wallet first");
      const [out] = await (wallet.features["solana:signMessage"] as SignMessageFeature).signMessage({ account, message });
      return out.signature;
    },
    async signTransaction(transaction, chain) {
      if (!wallet || !account) throw new Error("Connect a wallet first");
      const [out] = await (wallet.features["solana:signTransaction"] as SignTxFeature).signTransaction({ account, transaction, chain });
      return out.signedTransaction;
    },
  }), [wallets, wallet, account, connect]);

  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>;
}

export function useWalletCtx(): Ctx {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWalletCtx outside WalletProvider");
  return ctx;
}
