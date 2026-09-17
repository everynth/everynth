import { sessionWallet } from "@/lib/session";
import { LaunchForm } from "./launch-form";

export default async function LaunchPage() {
  const wallet = await sessionWallet();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Launch a product</h1>
      <p className="opacity-70">
        Your file or secret is encrypted on this device before upload. Buyers unlock it after paying in USDC. You
        receive 95% straight to your wallet; nothing is held by the platform.
      </p>
      {wallet ? <LaunchForm /> : <p className="card">Connect your wallet and sign in (top right) to launch.</p>}
    </div>
  );
}
