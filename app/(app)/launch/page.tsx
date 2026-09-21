import { sessionWallet } from "@/lib/session";
import { LaunchForm } from "./launch-form";

export default async function LaunchPage() {
  const wallet = await sessionWallet();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <p className="kicker rise">Creator · Launch</p>
      <h1 className="chrome shimmer rise rise-2 text-3xl font-medium tracking-tight sm:text-5xl">Launch a product</h1>
      <p className="rise rise-3" style={{ color: "var(--ink2)" }}>
        Your file or secret is encrypted on this device before upload. Buyers unlock it after paying in SOL. You
        receive 95% straight to your wallet; nothing is held by the platform.
      </p>
      {wallet ? <div className="rise rise-4"><LaunchForm /></div> : <p className="card rise rise-4">Connect your wallet and sign in (top right) to launch.</p>}
    </div>
  );
}
