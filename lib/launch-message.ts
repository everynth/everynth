// Shared by browser and server (no node imports here): the creator signs exactly this text
// to confirm the terms of a launch, so it must be byte-identical on both sides.
// Price is in lamports: an integer renders the same everywhere, "0.50" vs "0.5" does not.
export type LaunchTerms = { title: string; price: number; kind: string };

// The exact lines the wallet shows for each action, built the same way in the browser and on the server.
export const editFields = (id: string, title: string, price: number) => [`Item: ${id}`, `Title: ${title}`, `Price: ${price} lamports`];
export const removeFields = (id: string, block: boolean) => [`Item: ${id}`, `Scope: ${block ? "product and creator" : "product"}`];

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
