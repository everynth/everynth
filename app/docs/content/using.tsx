import Link from "next/link";
import { Code, H2, H3, Note } from "../ui";

export function Selling() {
  return (
    <>
      <H2 id="what-you-can-sell">What you can sell</H2>
      <table>
        <thead>
          <tr>
            <th>Kind</th>
            <th>The buyer receives</th>
            <th>Limits</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>File</td>
            <td>The exact bytes you uploaded, decrypted on their device and downloaded</td>
            <td>200 MB. Executables and installers refused by name.</td>
          </tr>
          <tr>
            <td>Secret text</td>
            <td>A string shown after unlock: API key, invite link, credentials, licence</td>
            <td>64 KB</td>
          </tr>
          <tr>
            <td>GitHub repository</td>
            <td>A read-only collaborator invitation to your private repository</td>
            <td>Needs a token with admin rights. See <Link href="/docs/github-access">GitHub access</Link>.</td>
          </tr>
          <tr>
            <td>Your own app</td>
            <td>Sell a secret (for example the app URL) and gate the app with the ownership check</td>
            <td>See <Link href="/docs/ownership-check">Ownership check</Link>.</td>
          </tr>
        </tbody>
      </table>

      <H2 id="launch">Launching</H2>
      <ol>
        <li>Sign in, open <Link href="/launch">Launch</Link>.</li>
        <li>
          <strong>Title</strong> (3–80 characters), <strong>description</strong> (10–4000), <strong>category</strong>:
          AI Agent, API, Dataset, Tool, Research, Service or Community.
        </li>
        <li>
          <strong>Price</strong> in SOL, from 0.02 up to 1,000,000, at most 9 decimals. You receive 95% of it.
        </li>
        <li>
          <strong>Cover image</strong> (optional): PNG, JPEG, WebP or GIF up to 1 MB. Shown on the market card and the
          product page.
        </li>
        <li>Choose the kind and attach the file, paste the text, or enter the repository and token.</li>
        <li>
          Press <em>Confirm, encrypt &amp; launch</em>. Your wallet asks you to sign a confirmation of the terms —
          free, moves no funds. See <a href="#confirm">the confirmation signature</a> below.
        </li>
      </ol>
      <p>What happens in your browser when you press the button:</p>
      <Code>{`1. ask the wallet to sign the terms            (title, price, delivery kind)
2. generate a random AES-256-GCM key
3. encrypt the file / text with it            (plaintext never leaves this tab)
4. file:   upload the ciphertext straight to blob storage
   secret: send the small ciphertext with the form
5. send the key + listing details + signature to EVERYNTH (over TLS)
6. the server re-checks the signature, then stores the key wrapped with its master key`}</Code>

      <H3 id="confirm">The confirmation signature</H3>
      <p>
        Signing in proves the address is yours. Launching asks for a second signature, over the listing itself, so
        that a stolen session cookie cannot put something on sale under your address on terms you never saw:
      </p>
      <Code>{`everynth.vercel.app wants you to confirm this launch on EVERYNTH.
This is free and does not move any funds.

Title: Alpha Signals API
Price: 1000000000 lamports
Delivery: secret
Creator: 7uNq…UV8h
Issued at: 1758445200000`}</Code>
      <p>
        The server rebuilds that exact text from what was submitted and checks it against your address. Change the
        title, the price or the delivery kind after signing and it no longer matches, so the launch is refused. The
        signature is valid for five minutes and only for this domain. The price is written in lamports (1 SOL =
        1,000,000,000) because an integer reads the same everywhere.
      </p>
      <p>The product is live on the market the moment the request succeeds. There is no approval queue.</p>

      <H2 id="after-launch">After launch</H2>
      <H3 id="edit">Edit</H3>
      <p>
        From the product page or your <Link href="/dashboard">Dashboard</Link>, <em>Edit listing</em> changes title,
        description, category, price and cover. The encrypted content itself cannot be changed: to deliver something
        else, launch a new product. Existing buyers keep the version they bought.
      </p>
      <H3 id="remove">Remove</H3>
      <p>
        <em>Remove from market</em> unlists the product. It disappears from search and its page returns 404 to the
        public, but buyers who already paid can still open it from Purchases. Removal cannot be undone; relaunch if you
        change your mind.
      </p>
      <H3 id="dashboard">Dashboard</H3>
      <p>
        The <Link href="/dashboard">Dashboard</Link> lists your products with units sold and SOL earned (your 95%
        share), plus a total. Earnings are already in your wallet; there is nothing to withdraw.
      </p>
      <H3 id="profile">Your creator page</H3>
      <p>
        Every wallet has a public page at <code>/u/&lt;wallet&gt;</code> listing its live products. Buyers reach it
        from the &quot;by …&quot; link on any product.
      </p>

      <H2 id="rules">Rules</H2>
      <ul>
        <li>Sell only what you have the right to sell. No stolen data, malware, pirated content or credentials that are not yours.</li>
        <li>Describe accurately. Buyers cannot get refunds, so a misleading listing is reported and removed.</li>
        <li>A creator whose product is taken down for abuse can be blocked from launching again. See <Link href="/docs/moderation">Moderation</Link>.</li>
      </ul>
    </>
  );
}

export function Buying() {
  return (
    <>
      <H2 id="flow">The purchase flow</H2>
      <ol>
        <li>Sign in with the wallet you will pay from.</li>
        <li>On the product page press <em>Buy with SOL</em>.</li>
        <li>
          Your wallet shows one transaction with two transfers: the creator&apos;s 95% and the treasury&apos;s 5%. The
          total equals the listed price. Approve it.
        </li>
        <li>
          The button shows <em>Confirming payment…</em> while the chain confirms (usually a few seconds), then the
          server verifies the transaction itself.
        </li>
        <li>The page refreshes and the button becomes <em>Unlock &amp; open</em>.</li>
      </ol>
      <Note>
        <p>
          The wallet you pay with must be the wallet you signed in with. If they differ the Buy button refuses with{" "}
          <em>Connect the same wallet you signed in with</em>.
        </p>
      </Note>

      <H2 id="unlock">Unlocking</H2>
      <p>
        <em>Unlock &amp; open</em> fetches the ciphertext and the content key, decrypts on your device, then:
      </p>
      <ul>
        <li><strong>File</strong>: the download starts in your browser with the original file name.</li>
        <li><strong>Secret text</strong>: the text appears on the page.</li>
        <li><strong>GitHub repository</strong>: you are asked for your GitHub username and invited as a read-only collaborator.</li>
      </ul>
      <p>
        You can unlock again at any time from <Link href="/purchases">Purchases</Link>, even after the creator removes
        the product.
      </p>

      <H2 id="recovery">If something goes wrong mid-payment</H2>
      <p>
        Suppose your wallet sent the transaction but the tab closed before the server was told. Nothing is lost:
      </p>
      <ul>
        <li>Open the product and press Buy again.</li>
        <li>
          The server sees you already have an open order for this product and, before doing anything else, looks the
          order&apos;s reference key up on the chain.
        </li>
        <li>If it finds your paid transaction, the order is marked paid and the page shows Unlock. No new charge.</li>
        <li>If nothing was paid yet, the same order (and the same reference) is reused, so you cannot end up with two.</li>
      </ul>
      <p>
        If the server says <em>Paid, but not verified yet</em>, its RPC is simply behind the chain. Wait a few seconds
        and press Buy again; the same recovery runs.
      </p>

      <H2 id="what-can-go-wrong">What the server will refuse</H2>
      <table>
        <thead>
          <tr>
            <th>Situation</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Transaction failed on-chain</td>
            <td>Not paid. Nothing was transferred; try again.</td>
          </tr>
          <tr>
            <td>Amounts lower than the frozen order (for example a wallet that edited the transaction)</td>
            <td>Refused as underpaid. The SOL that did move is not refundable by EVERYNTH.</td>
          </tr>
          <tr>
            <td>A transaction that does not carry this order&apos;s reference key</td>
            <td>Refused, even if the amounts match: it paid for something else.</td>
          </tr>
          <tr>
            <td>The same transaction offered for a second purchase</td>
            <td>Refused. One signature settles one purchase, ever.</td>
          </tr>
        </tbody>
      </table>

      <H2 id="refunds">Refunds</H2>
      <p>
        There are none. Payment is wallet-to-wallet and delivery is instant, so the platform has nothing to reverse.
        Your protection is that the amount at risk is one price, the description is public, and{" "}
        <Link href="/docs/moderation">reports</Link> reach a human.
      </p>
    </>
  );
}

export function GithubAccess() {
  return (
    <>
      <H2 id="idea">The idea</H2>
      <p>
        GitHub has no shareable invite link for private repositories; access is granted per account. So instead of
        selling a link, you let EVERYNTH send the invitation: the buyer types their GitHub username after paying and is
        added as a read-only collaborator. Buyers always get the current version, and you can revoke access from
        GitHub whenever you like.
      </p>

      <H2 id="creator-setup">Creator setup</H2>
      <ol>
        <li>
          Create a <strong>fine-grained personal access token</strong> at GitHub → Settings → Developer settings →
          Personal access tokens. Limit it to the one repository you are selling.
        </li>
        <li>
          Give it the repository permission <strong>Administration: Read and write</strong>. Adding collaborators
          requires admin rights; a token with only <em>Contents</em> or <em>Metadata</em> is rejected at launch.
        </li>
        <li>
          On <Link href="/launch">Launch</Link>, choose <em>Access to a private GitHub repository</em>, enter{" "}
          <code>owner/repository</code> and paste the token.
        </li>
      </ol>
      <p>At launch the server checks the token against GitHub:</p>
      <Code>{`GET https://api.github.com/repos/{owner}/{repo}
→ must be 200 and permissions.admin == true`}</Code>
      <p>
        The token is then stored wrapped with the master key, exactly like a content key. It is never shown to buyers
        or in any API response.
      </p>
      <Note kind="warn">
        <p>
          Use a token scoped to this one repository. If you ever want to stop sales, remove the product and revoke the
          token on GitHub; both take seconds.
        </p>
      </Note>

      <H2 id="buyer-flow">Buyer flow</H2>
      <ol>
        <li>Buy the product like any other.</li>
        <li>Press <em>Unlock &amp; open</em>. Instead of a download you see a field for your GitHub username.</li>
        <li>Press <em>Invite me</em>. EVERYNTH calls GitHub on the creator&apos;s behalf:</li>
      </ol>
      <Code>{`PUT https://api.github.com/repos/{owner}/{repo}/collaborators/{username}
{ "permission": "pull" }
→ 201 invitation sent · 204 already a collaborator`}</Code>
      <ol start={4}>
        <li>Accept the invitation at <code>github.com/{`{owner}/{repo}`}/invitations</code> or from the GitHub notification.</li>
      </ol>

      <H2 id="limits">Limits and rules</H2>
      <ul>
        <li><strong>One GitHub account per purchase.</strong> You can resend to the same username (typo in the email, expired invitation) but not move the purchase to a different account.</li>
        <li>Invitations expire after seven days on GitHub&apos;s side; resend from Purchases if that happens.</li>
        <li>GitHub limits the number of collaborators on private repositories depending on the owner&apos;s plan. That limit is the creator&apos;s to manage.</li>
        <li>The creator can revoke access on GitHub at any time. EVERYNTH does not police that; the product description should say what the buyer is getting (for example &quot;read access for 12 months&quot;).</li>
      </ul>
    </>
  );
}

export function Moderation() {
  return (
    <>
      <H2 id="model">The model</H2>
      <p>
        Publishing is open: a product is live the moment it is launched. Safety comes after the fact, and the tools
        are deliberately blunt so they can be applied fast.
      </p>

      <H2 id="reports">Reports</H2>
      <p>
        Any signed-in wallet can report a product from its page (<em>Report this product</em>) with a reason of 5–1000
        characters. One report per wallet per product. Reports go to the admin queue at <code>/admin</code>.
      </p>

      <H2 id="takedown">Takedowns</H2>
      <p>
        An admin can remove any product. The listing leaves the market and its page returns 404 to the public. Buyers
        who already paid keep access, because they paid the creator directly and EVERYNTH has no way to refund them.
      </p>

      <H2 id="blocking">Blocking a creator</H2>
      <p>
        For abuse, an admin can <em>Remove + block creator</em>. Every product from that wallet is unlisted and the
        wallet can no longer launch (the API answers 403). Blocks are listed on <code>/admin</code> and can be lifted;
        unblocking does not relist the removed products.
      </p>

      <H2 id="file-types">Refused file types</H2>
      <p>
        Files are encrypted in the browser, so the server cannot inspect their contents. It can and does refuse by
        file name: executables and installers are not allowed, whatever the description says.
      </p>
      <Code>{`.exe .msi .bat .cmd .com .scr .pif .vbs .vbe .ps1 .dll
.dmg .pkg .app .apk .deb .rpm .jar .lnk`}</Code>
      <p>
        Zip your source code or documents instead. An archive that contains an executable cannot be detected; that is
        what reports are for.
      </p>

      <H2 id="inspection">Inspecting reported content</H2>
      <p>
        Because the platform holds content keys wrapped (see <Link href="/docs/encryption#honest-limit">the honest limit</Link>),
        an admin can decrypt a reported product to judge a report. This is the only circumstance in which it is done.
      </p>

      <H2 id="terms">Terms</H2>
      <p>
        The short version of the <Link href="/terms">terms of use</Link>: sell only what you have the right to sell, no
        refunds, no warranty, and wallet addresses and payments are public by the nature of Solana.
      </p>
    </>
  );
}
