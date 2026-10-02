"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useWalletCtx } from "@/components/wallet";
import { BLOCKED_EXTENSIONS, CATEGORIES, MAX_PAYLOAD_BYTES, MAX_SECRET_BYTES } from "@/lib/config";
import { encryptContent } from "@/lib/content-crypto";
import { launchMessage } from "@/lib/launch-message";
import { parseFields } from "@/lib/product-form";

type Kind = "file" | "secret" | "github";
type Level = "sys" | "in" | "ok" | "warn" | "err";
type Line = { t: string; k: Level; s: string };

// Event-time only: the React Compiler rejects clock reads during render.
const stamp = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
const issuedNow = () => Date.now();
const size = (b: number) => (b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 ** 2).toFixed(2)} MB`);
const bar = (pct: number) => `[${"█".repeat(Math.round(pct / 5)).padEnd(20, "░")}] ${pct.toFixed(0).padStart(3)}%`;
const MARK: Record<Level, string> = { sys: "·", in: "›", ok: "✓", warn: "!", err: "✗" };

const KINDS: { k: Kind; flag: string; label: string; hint: string }[] = [
  { k: "file", flag: "--file", label: "A file", hint: "Dataset, research, template, source archive — up to 200 MB. Encrypted here before upload; executables are refused." },
  { k: "secret", flag: "--secret", label: "Secret text", hint: "API key, invite link, credentials — up to 64 KB, revealed to the buyer only after the chain confirms payment." },
  { k: "github", flag: "--github", label: "GitHub repo", hint: "Buyers enter their GitHub username and are added as read-only collaborators automatically." },
];

export function LaunchForm({ wallet }: { wallet: string }) {
  const router = useRouter();
  const { signMessage } = useWalletCtx();
  const [kind, setKind] = useState<Kind>("file");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [preview, setPreview] = useState("");
  const [cover, setCover] = useState<{ url: string; name: string; bytes: number } | null>(null);
  const [payload, setPayload] = useState<{ name: string; bytes: number; blocked: boolean } | null>(null);
  const [secret, setSecret] = useState("");
  const [repo, setRepo] = useState("");
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [log, setLog] = useState<Line[]>([
    { t: "--:--:--", k: "sys", s: "everynth launch — one product, encrypted on this device" },
    { t: "--:--:--", k: "sys", s: `session ${wallet.slice(0, 4)}…${wallet.slice(-4)} · mainnet-beta · fee 5%` },
    { t: "--:--:--", k: "sys", s: "waiting for input…" },
  ]);
  const logBox = useRef<HTMLDivElement>(null);

  const say = (k: Level, s: string) => setLog((l) => [...l, { t: stamp(), k, s }]);
  useEffect(() => { logBox.current?.scrollTo({ top: logBox.current.scrollHeight }); }, [log]);

  const sol = Number(price);
  const priceOk = price !== "" && Number.isFinite(sol) && sol >= 0.02;
  const secretBytes = new TextEncoder().encode(secret).length;
  const payloadOk =
    kind === "file" ? !!payload && !payload.blocked && payload.bytes <= MAX_PAYLOAD_BYTES
    : kind === "secret" ? secretBytes > 0 && secretBytes <= MAX_SECRET_BYTES
    : /^[\w.-]+\/[\w.-]+$/.test(repo);
  const described = title.trim().length >= 3 && desc.trim().length >= 10 && priceOk;
  const step = busy ? 3 : described && payloadOk ? 2 : described ? 1 : 0;

  function pickPayload(file: File | null) {
    if (!file) return setPayload(null);
    const blocked = BLOCKED_EXTENSIONS.test(file.name);
    setPayload({ name: file.name, bytes: file.size, blocked });
    if (blocked) say("err", `${file.name} — executables and installers cannot be sold here`);
    else if (file.size > MAX_PAYLOAD_BYTES) say("err", `${file.name} — ${size(file.size)} is over the 200 MB limit`);
    else say("ok", `payload ${file.name} · ${size(file.size)} · encrypts to ~${size(file.size + 28)}`);
  }

  function pickCover(file: File | null) {
    setCover((old) => {
      if (old) URL.revokeObjectURL(old.url);
      return file ? { url: URL.createObjectURL(file), name: file.name, bytes: file.size } : null;
    });
    if (file) say("ok", `cover ${file.name} · ${size(file.size)}`);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    say("in", `everynth launch --kind ${kind} --price ${price}`);
    try {
      const form = new FormData(e.currentTarget);
      const file = form.get("file");
      const secretField = form.get("secret");
      form.delete("file");
      form.delete("secret");

      // Confirm the terms in the wallet first: asking after a 200 MB upload would waste it.
      const fields = parseFields(form);
      if (typeof fields === "string") throw new Error(fields);
      const issuedAt = issuedNow();
      say("sys", "waiting for wallet confirmation…");
      const signature = await signMessage(
        new TextEncoder().encode(launchMessage(location.host, wallet, { title: fields.title, price: fields.price, kind }, issuedAt)),
      );
      form.set("issuedAt", String(issuedAt));
      form.set("signature", btoa(String.fromCharCode(...signature)));
      say("ok", `confirmed · ${fields.title} · ${fields.price} lamports · ${kind}`);

      if (kind === "github") {
        // Nothing to encrypt here: the server checks the token against GitHub and stores it wrapped.
        say("sys", `checking admin access to ${repo}…`);
      } else {
        let plain: Uint8Array;
        if (kind === "file") {
          if (!(file instanceof File) || file.size === 0) throw new Error("Choose a file");
          if (file.size > MAX_PAYLOAD_BYTES) throw new Error("File is larger than 200 MB");
          if (BLOCKED_EXTENSIONS.test(file.name)) throw new Error("Executables and installers cannot be sold here. Zip source code or documents instead.");
          plain = new Uint8Array(await file.arrayBuffer());
          form.set("fileName", file.name);
          form.set("fileType", file.type);
        } else {
          plain = new TextEncoder().encode(String(secretField ?? ""));
          if (plain.length === 0) throw new Error("Enter the secret text buyers will receive");
          if (plain.length > MAX_SECRET_BYTES) throw new Error("Secret text is too long (max 64 KB)");
        }

        say("sys", `AES-256-GCM over ${size(plain.length)}…`);
        // Plaintext never leaves this device: only the ciphertext and its key are sent.
        const { key, payload: sealed } = await encryptContent(plain);
        form.set("key", btoa(String.fromCharCode(...key)));
        say("ok", `sealed ${size(sealed.byteLength)} · key wrapped for delivery`);
        if (kind === "file") {
          // Straight to blob storage, so large files never pass through the API.
          setPct(0);
          const blob = await upload(`${(file as File).name}.enc`, new Blob([sealed as BlobPart]), {
            access: "public",
            handleUploadUrl: "/api/upload",
            contentType: "application/octet-stream",
            onUploadProgress: (p) => setPct(p.percentage),
          });
          form.set("payloadUrl", blob.url);
          setPct(null);
          say("ok", "ciphertext stored");
        } else {
          form.set("payload", new Blob([sealed as BlobPart]));
        }
      }

      say("sys", "publishing listing…");
      const res = await fetch("/api/products", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      say("ok", `live → /p/${body.id}`);
      router.push(`/p/${body.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Launch failed";
      setError(message);
      say("err", message);
      setBusy(false);
      setPct(null);
    }
  }

  const active = KINDS.find((k) => k.k === kind)!;

  return (
    <form onSubmit={submit} className="lx">
      {/* ── left rail: what this session is, and how far it got ── */}
      <aside className="lx-rail">
        <div className="term">
          <div className="term-bar"><span className="term-dots"><i /><i /><i /></span> session</div>
          <dl className="lx-facts">
            <dt>signer</dt><dd>{wallet.slice(0, 4)}…{wallet.slice(-4)}</dd>
            <dt>network</dt><dd className="v-info">mainnet-beta</dd>
            <dt>you keep</dt><dd className="v-good">95%</dd>
            <dt>platform fee</dt><dd className="v-fee">5%</dd>
            <dt>min price</dt><dd>0.02 SOL</dd>
            <dt>max file</dt><dd>200 MB</dd>
            <dt>listing cost</dt><dd className="v-good">free</dd>
          </dl>
        </div>
        <div className="term">
          <div className="term-bar">pipeline</div>
          <ol className="lx-steps">
            {["describe the listing", "attach what buyers get", "confirm, encrypt, upload", "live on the market"].map((s, i) => (
              <li key={s} className={i < step ? "is-done" : i === step ? "is-now" : ""}>
                <b>{String(i + 1).padStart(2, "0")}</b>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="lx-note">
          Nothing is held by the platform. The buyer&apos;s wallet pays yours directly; we only pass the sealed bytes along.
        </p>
      </aside>

      {/* ── centre: the form, written as a terminal session ── */}
      <div className="term lx-main">
        <div className="term-bar">
          <span className="term-dots"><i /><i /><i /></span>
          ~/everynth/launch
          <span className={`lx-bar-right ${busy ? "is-run" : "is-ready"}`}>{busy ? "running" : "ready"}</span>
        </div>
        <div className="term-body">
          <p className="lx-cmd"><span>$</span> everynth launch --new</p>

          <div className="lx-row">
            <span className="lx-caret">›</span>
            <div>
              <div className="lx-label">--title <em>3–80 chars</em><span className="lx-count">{title.length}/80</span></div>
              <input name="title" required minLength={3} maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)}
                onBlur={() => title.trim().length >= 3 && say("ok", `title "${title.trim()}"`)}
                placeholder="What are you selling?" className="lx-in" />
            </div>
          </div>

          <div className="lx-row">
            <span className="lx-caret">›</span>
            <div>
              <div className="lx-label">--description <em>markdown-free plain text</em><span className="lx-count">{desc.length}/4000</span></div>
              <textarea name="description" required minLength={10} maxLength={4000} rows={6} value={desc} onChange={(e) => setDesc(e.target.value)}
                onBlur={() => desc.trim().length >= 10 && say("ok", `description ${desc.trim().length} chars`)}
                placeholder="What it is, what a buyer can do with it, what it is not." className="lx-in" />
            </div>
          </div>

          <div className="lx-cols">
            <div className="lx-row">
              <span className="lx-caret">›</span>
              <div>
                <div className="lx-label">--category</div>
                <select name="category" required value={category} onChange={(e) => { setCategory(e.target.value); say("ok", `category ${e.target.value}`); }} className="lx-in lx-select">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="lx-row">
              <span className="lx-caret">›</span>
              <div>
                <div className="lx-label">--price <em>SOL</em></div>
                <input name="price" required inputMode="decimal" pattern="\d{1,7}(\.\d{1,9})?" value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onBlur={() => price !== "" && say(priceOk ? "ok" : "warn", priceOk ? `price ${sol} SOL → you ${(sol * 0.95).toFixed(4)} · fee ${(sol * 0.05).toFixed(4)}` : "price is below the 0.02 SOL minimum")}
                  placeholder="0.5" className="lx-in" />
                {price !== "" && !priceOk && <p className="lx-err">below the 0.02 SOL minimum</p>}
              </div>
            </div>
          </div>

          <div className="lx-row">
            <span className="lx-caret">›</span>
            <div>
              <div className="lx-label">--preview <em>optional, https only</em></div>
              <input name="previewUrl" type="url" inputMode="url" pattern="https://.*" value={preview} onChange={(e) => setPreview(e.target.value)}
                onBlur={() => preview && say("ok", "preview link attached")}
                placeholder="https://… demo, sample page, README or video buyers can look at first" className="lx-in" />
            </div>
          </div>

          <div className="lx-row">
            <span className="lx-caret">›</span>
            <div>
              <div className="lx-label">--cover <em>optional image, max 1 MB</em></div>
              <input type="file" name="cover" accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => pickCover(e.target.files?.[0] ?? null)} className="lx-in lx-file" />
            </div>
          </div>

          <p className="lx-cmd lx-cmd-2"><span>$</span> everynth launch --payload</p>

          <div className="lx-kinds" role="radiogroup" aria-label="What buyers receive">
            {KINDS.map(({ k, flag, label }) => (
              <label key={k} className={`lx-kind${kind === k ? " is-active" : ""}`}>
                <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => { setKind(k); say("in", `kind ${k}`); }} className="sr-only" />
                <b>{flag}</b>
                <span>{label}</span>
              </label>
            ))}
          </div>
          <p className="lx-hint">{active.hint}</p>

          {kind === "file" && (
            <div className="lx-row lx-row-plain">
              <span className="lx-caret">›</span>
              <div>
                <div className="lx-label">payload file</div>
                <input type="file" name="file" required aria-label="Product file (max 200 MB)"
                  onChange={(e) => pickPayload(e.target.files?.[0] ?? null)} className="lx-in lx-file" />
                {payload && (
                  <p className={payload.blocked ? "lx-err" : "lx-ok"}>
                    {payload.blocked
                      ? `${payload.name} is an executable — zip the source or ship a document instead`
                      : `${payload.name} · ${size(payload.bytes)} · sealed ≈ ${size(payload.bytes + 28)}`}
                  </p>
                )}
              </div>
            </div>
          )}

          {kind === "secret" && (
            <div className="lx-row lx-row-plain">
              <span className="lx-caret">›</span>
              <div>
                <div className="lx-label">secret text<span className="lx-count">{size(secretBytes)} / 64 KB</span></div>
                <textarea name="secret" required rows={5} value={secret} onChange={(e) => setSecret(e.target.value)}
                  onBlur={() => secretBytes > 0 && say("ok", `secret ${size(secretBytes)} staged`)}
                  placeholder="sk-live-…&#10;https://discord.gg/…&#10;user: … / pass: …" className="lx-in" />
                {secretBytes > MAX_SECRET_BYTES && <p className="lx-err">over the 64 KB limit</p>}
              </div>
            </div>
          )}

          {kind === "github" && (
            <>
              <div className="lx-row lx-row-plain">
                <span className="lx-caret">›</span>
                <div>
                  <div className="lx-label">--repo</div>
                  <input name="repo" required pattern="[\w.-]+/[\w.-]+" value={repo} onChange={(e) => setRepo(e.target.value)}
                    onBlur={() => repo && say("ok", `repo ${repo}`)} placeholder="owner/repository" className="lx-in" />
                </div>
              </div>
              <div className="lx-row lx-row-plain">
                <span className="lx-caret">›</span>
                <div>
                  <div className="lx-label">--token <em>stored encrypted, never shown to buyers</em></div>
                  <input type="password" name="token" required placeholder="github_pat_…" aria-label="GitHub token" autoComplete="off" className="lx-in" />
                  <p className="lx-meta">
                    Fine-grained token from github.com → Settings → Developer settings, limited to this repository, with
                    &quot;Administration: read and write&quot;.
                  </p>
                </div>
              </div>
            </>
          )}

          {error && <p role="alert" className="lx-err lx-err-block">{error}</p>}

          <div className="lx-submit">
            <button disabled={busy} className="btn">
              {busy ? (pct === null ? "Check your wallet…" : `Uploading ${pct.toFixed(0)}%`) : kind === "github" ? "Confirm & launch" : "Confirm, encrypt & launch"}
            </button>
            <span className="lx-hint">
              {busy
                ? "Keep this tab open until it goes live."
                : "Your wallet asks you to confirm the title, price and delivery. Signing is free and moves no funds; encryption then runs on this device."}
            </span>
          </div>
        </div>
      </div>

      {/* ── right: what the market will see, and what the console is doing ── */}
      <aside className="lx-side">
        <div className="term">
          <div className="term-bar">live preview</div>
          <div className="lx-prev">
            <div className="lx-prev-cover">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL, never uploaded from here
                <img src={cover.url} alt="" />
              ) : (
                <div className="cover-blank">{(title.trim()[0] ?? "◆").toUpperCase()}</div>
              )}
              <span className="pill pill-sm lx-prev-badge" data-cat={category}>{category}</span>
            </div>
            <b className="lx-prev-title">{title.trim() || "Untitled product"}</b>
            <p className="lx-prev-desc">{desc.trim() || "Your description shows here, trimmed to two lines on the market grid."}</p>
            <div className="lx-prev-foot">
              <span className={priceOk ? "is-price" : ""}>{priceOk ? `${sol} SOL` : "— SOL"}</span>
              <span>{wallet.slice(0, 4)}…{wallet.slice(-4)}</span>
            </div>
          </div>
          <dl className="lx-facts lx-facts-split">
            <dt>you receive</dt><dd className={priceOk ? "v-good" : ""}>{priceOk ? `${(sol * 0.95).toFixed(4)} SOL` : "—"}</dd>
            <dt>platform fee</dt><dd className={priceOk ? "v-fee" : ""}>{priceOk ? `${(sol * 0.05).toFixed(4)} SOL` : "—"}</dd>
            <dt>per 10 sales</dt><dd className={priceOk ? "v-info" : ""}>{priceOk ? `${(sol * 9.5).toFixed(3)} SOL` : "—"}</dd>
          </dl>
        </div>

        <div className="term lx-console">
          <div className="term-bar">stdout{pct !== null && <span className="lx-bar-right">{pct.toFixed(0)}%</span>}</div>
          <div className="lx-log" ref={logBox} role="log" aria-live="polite">
            {log.map((l, i) => (
              <p key={i} className={`lx-log-line is-${l.k}`}>
                <span className="lx-log-t">{l.t}</span>
                <span className="lx-log-m">{MARK[l.k]}</span>
                <span>{l.s}</span>
              </p>
            ))}
            {pct !== null && <p className="lx-log-line is-sys"><span className="lx-log-t" /><span className="lx-log-m">·</span><span>{bar(pct)}</span></p>}
            <p className="lx-log-line is-sys"><span className="lx-log-t" /><span className="lx-log-m">$</span><span className="lx-blink">▌</span></p>
          </div>
        </div>
      </aside>
    </form>
  );
}
