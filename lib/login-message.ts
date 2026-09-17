// Shared by browser and server (no node imports here): the wallet signs exactly this text,
// so it must be byte-identical on both sides.
export function loginMessage(host: string, wallet: string, issuedAt: number): string {
  return `${host} wants you to sign in to EVERYNTH.\nThis is free and does not move any funds.\n\nWallet: ${wallet}\nIssued at: ${issuedAt}`;
}
