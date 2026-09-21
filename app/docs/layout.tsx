import { DOC_GROUPS } from "@/lib/docs";
import { DocsNav } from "./nav";

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  return (
    <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
      <DocsNav groups={DOC_GROUPS} />
      <div className="doc min-w-0">{children}</div>
    </div>
  );
}
