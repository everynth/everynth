import { WalletProvider } from "@/components/wallet";

// A token site stands alone — no app chrome — but its swap panel needs a wallet.
export default function TokenSiteLayout({ children }: LayoutProps<"/t/[slug]">) {
  return <WalletProvider>{children}</WalletProvider>;
}
