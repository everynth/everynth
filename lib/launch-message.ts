// Shared by browser and server (no node imports here): the creator signs exactly this text
// to confirm the terms of a launch, so it must be byte-identical on both sides.
// Price is in lamports: an integer renders the same everywhere, "0.50" vs "0.5" does not.
export type LaunchTerms = { title: string; price: number; kind: string };

// The exact lines the wallet shows for each action, built the same way in the browser and on the server.
export const editFields = (id: string, title: string, price: number) => [`Item: ${id}`, `Title: ${title}`, `Price: ${price} lamports`];
export const removeFields = (id: string, block: boolean) => [`Item: ${id}`, `Scope: ${block ? "product and creator" : "product"}`];

// A token launch freezes these exact lines. Stack ids are joined in run order, because the order is
// part of the terms: it decides who gets what.
export const tokenFields = (t: { productId: string; name: string; ticker: string; supply: number; stack: string[]; gateBalance: number; gateUnlocks: string }) => [
  `Utility: ${t.productId}`,
  `Token: ${t.name} (${t.ticker})`,
  `Supply: ${t.supply}`,
  `Mechanics: ${t.stack.join(",")}`,
  `Gate: ${t.gateBalance} unlocks ${t.gateUnlocks}`,
];

// Everything else a creator signs: editing a listing, taking one down. Same shape, free, no funds.
// `fields` are the exact lines the wallet shows, e.g. ["Item: <id>", "Price: 20000000 lamports"].
export function actionMessage(host: string, wallet: string, action: string, fields: string[], issuedAt: number): string {
  return `${host} wants you to confirm: ${action}.
This is free and does not move any funds.

${fields.join("\n")}
Wallet: ${wallet}
Issued at: ${issuedAt}`;
}

export function launchMessage(host: string, wallet: string, terms: LaunchTerms, issuedAt: number): string {
  return `${host} wants you to confirm this launch on EVERYNTH.
This is free and does not move any funds.

Title: ${terms.title}
Price: ${terms.price} lamports
Delivery: ${terms.kind}
Creator: ${wallet}
Issued at: ${issuedAt}`;
}
