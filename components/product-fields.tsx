import { CATEGORIES } from "@/lib/config";
import type { Product } from "@/lib/db";
import { formatSol } from "@/lib/money";

// Listing fields shared by the launch and edit forms. Plain inputs; the parent form owns submission.
export function ProductFields({ defaults }: { defaults?: Product }) {
  return (
    <>
      <label className="flex flex-col gap-1.5 text-sm">
        Title
        <input name="title" required minLength={3} maxLength={80} defaultValue={defaults?.title} className="field" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Description
        <textarea name="description" required minLength={10} maxLength={4000} rows={6} defaultValue={defaults?.description} className="field" />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          Category
          <select name="category" required defaultValue={defaults?.category} className="field">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Price (SOL, min 0.02)
          <input
            name="price"
            required
            inputMode="decimal"
            pattern="\d{1,7}(\.\d{1,9})?"
            placeholder="0.5"
            defaultValue={defaults ? formatSol(defaults.price).replace(/,/g, "") : undefined}
            className="field"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        Cover image (optional, max 1 MB){defaults?.has_cover && " — leave empty to keep the current one"}
        <input type="file" name="cover" accept="image/png,image/jpeg,image/webp,image/gif" className="field" />
      </label>
    </>
  );
}
