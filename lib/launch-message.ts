// Shared by browser and server (no node imports here): the creator signs exactly this text
// to confirm the terms of a launch, so it must be byte-identical on both sides.
// Price is in lamports: an integer renders the same everywhere, "0.50" vs "0.5" does not.
export type LaunchTerms = { title: string; price: number; kind: string };

export function launchMessage(host: string, wallet: string, terms: LaunchTerms, issuedAt: number): string {
  return `${host} wants you to confirm this launch on EVERYNTH.
This is free and does not move any funds.

Title: ${terms.title}
Price: ${terms.price} lamports
Delivery: ${terms.kind}
Creator: ${wallet}
Issued at: ${issuedAt}`;
}
