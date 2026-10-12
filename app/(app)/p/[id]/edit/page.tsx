import { notFound } from "next/navigation";
import { PRODUCT_COLS, query, type Product } from "@/lib/db";
import { sessionWallet } from "@/lib/session";
import { EditForm } from "./edit-form";

export default async function EditPage({ params }: PageProps<"/p/[id]/edit">) {
  const { id } = await params;
  const wallet = await sessionWallet();
  const [product] = await query<Product>(`select ${PRODUCT_COLS} from products where id = $1 and creator = $2`, [id, wallet ?? ""]);
  if (!product) notFound();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Edit listing</h1>
      <p className="opacity-70">The encrypted content itself cannot be changed. To deliver something else, launch a new product.</p>
      <EditForm product={product} />
    </div>
  );
}
