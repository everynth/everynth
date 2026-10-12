// Every tutorial in one list. Adding the next one is a new entry here — the docs nav, the index,
// the pages and the sitemap all read from this.
// Slugs are nested under `tutorial/` so a permalink says what it teaches: /docs/tutorial/launch-product
// can never be mistaken for the token launchpad, the way a bare "launch" could.
// Videos live in the blob store, never in the repository: a git history full of MP4s is forever.

export type Chapter = { at: number; label: string };
export type Tutorial = {
  slug: string;
  title: string;
  summary: string;
  /** Absent until the video is recorded; the written steps carry the page in the meantime. */
  video?: { src: string; poster: string; seconds: number };
  steps: string[];
  notes?: string[];
  chapters?: Chapter[];
};

const BLOB = "https://zuayad0lbjhrm0ma.public.blob.vercel-storage.com/docs";

export const TUTORIALS: Tutorial[] = [
  {
    slug: "tutorial/launch-product",
    title: "Launch a product",
    summary: "The whole thing end to end: a zip on your laptop becomes a listing priced in SOL, in under a minute.",
    video: { src: `${BLOB}/tutorial-launch.mp4`, poster: `${BLOB}/tutorial-launch-poster.jpg`, seconds: 55 },
    steps: [
      "Sign in with your wallet, then open Launch product (/launch/product).",
      "Title: what you are selling, 3–80 characters.",
      "Description: what it is, who it is for, and what it is not.",
      "Category and price. The minimum is 0.02 SOL; the split updates as you type.",
      "Choose what buyers receive — a file, secret text, or access to a GitHub repository.",
      "Press Confirm, encrypt & launch and sign the confirmation your wallet shows.",
      "The file is encrypted on your device, uploaded as ciphertext, and the listing goes live.",
    ],
    notes: [
      "Files are capped at 200 MB. Ship source, not node_modules: a clean project zip is usually a few megabytes.",
      "Open your zip before you sell it. Anything inside goes to the buyer, including a stray .env or a wallet key file.",
      "Signing is free and moves no funds. The only transaction in EVERYNTH is a purchase.",
    ],
    chapters: [
      { at: 3, label: "The market" },
      { at: 5.6, label: "Open Launch" },
      { at: 8.2, label: "The launch console" },
      { at: 10.8, label: "Title" },
      { at: 15.6, label: "Description" },
      { at: 22.6, label: "Category" },
      { at: 25.2, label: "Price — 1 SOL" },
      { at: 28, label: "Your split, live" },
      { at: 30.7, label: "Attach the file" },
      { at: 33.4, label: "Encrypted on your device" },
      { at: 36.1, label: "Confirm & launch" },
      { at: 38.7, label: "The wallet confirmation" },
      { at: 45.7, label: "Live on the market" },
      { at: 48.3, label: "What a buyer pays" },
    ],
  },
  {
    slug: "tutorial/buy-and-unlock",
    title: "Buy and unlock",
    summary: "What a purchase looks like from the buyer's side, including what happens if the tab closes mid-payment.",
    steps: [
      "Sign in with the wallet you will pay from — it must be the same one.",
      "Open the product and press Buy with SOL.",
      "Your wallet shows one transaction with two transfers: 95% to the creator, 5% to the treasury.",
      "The chain confirms, the server verifies the transaction itself, and the button becomes Unlock & open.",
      "Everything you own stays in Purchases, re-openable any time.",
    ],
    notes: ["If your browser closes after paying, press Buy again: the server finds the paid order on the chain and unlocks it. You are never charged twice."],
  },
  {
    slug: "tutorial/edit-and-remove",
    title: "Edit, unlist and delete",
    summary: "Changing a listing after launch, taking it down, and what your buyers keep either way.",
    steps: [
      "Edit listing changes title, description, category, price and cover. The encrypted content never changes.",
      "Both editing and unlisting ask your wallet to confirm the exact change.",
      "Remove from market hides the product from search and returns 404 to the public.",
      "Buyers who already paid keep their access from Purchases, permanently.",
    ],
  },
  {
    slug: "tutorial/message-a-creator",
    title: "Message a creator",
    summary: "Private buyer-to-creator messages. Not built yet — this page will carry the walkthrough when it ships.",
    steps: [],
  },
];

export const tutorialBySlug = (slug: string) => TUTORIALS.find((t) => t.slug === slug);
export const TUTORIAL_DOCS = TUTORIALS.map(({ slug, title, summary }) => ({ slug, title, summary }));
