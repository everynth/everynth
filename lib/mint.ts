// The token itself: a Token-2022 mint built in the launcher's browser and signed by their wallet.
// Shared by browser and server so the server can verify exactly what the browser built.
//
// Extensions: TransferFee (the creator fee, taken by the token program on every transfer, no code
// of ours in the path) and MetadataPointer → TokenMetadata on the mint itself (name, ticker, a URI
// to /api/launches/<id>/metadata). Supply is minted once, then the mint authority is burned, so no
// hook, desk or admin can ever mint more. No freeze authority, so nobody can freeze a holder.
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  AuthorityType, createAssociatedTokenAccountInstruction, createInitializeMetadataPointerInstruction, createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction, createMintToInstruction, createSetAuthorityInstruction, ExtensionType,
  getAssociatedTokenAddressSync, getMintLen, LENGTH_SIZE, TOKEN_2022_PROGRAM_ID, TYPE_SIZE,
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";

export const DECIMALS = 6;
/** u64 max: the creator fee is a plain percentage of every transfer, never capped per transfer. */
export const MAX_FEE = BigInt("18446744073709551615");
export const EXTENSIONS = [ExtensionType.TransferFeeConfig, ExtensionType.MetadataPointer];

export const baseUnits = (supply: number | bigint) => BigInt(supply) * 10n ** BigInt(DECIMALS);
export const feeBps = (creatorFeePercent: number) => creatorFeePercent * 100;
export const ataOf = (mint: PublicKey, owner: PublicKey) => getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID);

/** Bytes the mint account ends up at once the metadata is written, for the rent calculation. */
export function mintSpace(name: string, symbol: string, uri: string) {
  const metadata = pack({ mint: PublicKey.default, name, symbol, uri, additionalMetadata: [] });
  return getMintLen(EXTENSIONS) + TYPE_SIZE + LENGTH_SIZE + metadata.length;
}

export function mintInstructions(p: { payer: PublicKey; mint: PublicKey; name: string; symbol: string; uri: string; supply: number; creatorFee: number; lamports: number }) {
  const ata = ataOf(p.mint, p.payer);
  return [
    // allocate the mint sized for its extensions; the metadata instruction grows it, so the rent covers both
    SystemProgram.createAccount({ fromPubkey: p.payer, newAccountPubkey: p.mint, space: getMintLen(EXTENSIONS), lamports: p.lamports, programId: TOKEN_2022_PROGRAM_ID }),
    createInitializeTransferFeeConfigInstruction(p.mint, p.payer, p.payer, feeBps(p.creatorFee), MAX_FEE, TOKEN_2022_PROGRAM_ID),
    createInitializeMetadataPointerInstruction(p.mint, p.payer, p.mint, TOKEN_2022_PROGRAM_ID),
    createInitializeMintInstruction(p.mint, DECIMALS, p.payer, null, TOKEN_2022_PROGRAM_ID),
    createInitializeInstruction({ programId: TOKEN_2022_PROGRAM_ID, mint: p.mint, metadata: p.mint, name: p.name, symbol: p.symbol, uri: p.uri, mintAuthority: p.payer, updateAuthority: p.payer }),
    createAssociatedTokenAccountInstruction(p.payer, ata, p.payer, p.mint, TOKEN_2022_PROGRAM_ID),
    createMintToInstruction(p.mint, ata, p.payer, baseUnits(p.supply), [], TOKEN_2022_PROGRAM_ID),
    createSetAuthorityInstruction(p.mint, p.payer, AuthorityType.MintTokens, null, [], TOKEN_2022_PROGRAM_ID),
  ];
}

export const isDevnet = (rpc: string) => /devnet/i.test(rpc);
export const chainOf = (rpc: string) => (isDevnet(rpc) ? "solana:devnet" : "solana:mainnet");
export const explorer = (kind: "tx" | "token", id: string, rpc: string) =>
  `https://solscan.io/${kind}/${id}${isDevnet(rpc) ? "?cluster=devnet" : ""}`;
export const short = (s: string) => `${s.slice(0, 4)}…${s.slice(-4)}`;
