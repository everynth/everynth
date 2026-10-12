import { query } from "@/lib/db";
import { GH_USER_RE, inviteCollaborator } from "@/lib/github";
import { masterKey, unwrapKey } from "@/lib/keywrap";
import { sessionWallet } from "@/lib/session";

type Row = { github_repo: string | null; wrapped_key: string; github_user: string | null };

// Buyer of a PAID "github" purchase names their GitHub account; we invite it as a read-only collaborator.
// One account per purchase: it can be re-sent to the same name, not moved to another.
export async function POST(request: Request, { params }: RouteContext<"/api/purchases/[id]/github">) {
  const { id } = await params;
  const buyer = await sessionWallet();
  if (!buyer) return Response.json({ error: "sign in first" }, { status: 401 });
  const { username } = (await request.json().catch(() => null)) ?? {};
  if (typeof username !== "string" || !GH_USER_RE.test(username)) return Response.json({ error: "enter a valid GitHub username" }, { status: 400 });

  const [row] = await query<Row>(
    `select p.github_repo, p.wrapped_key, x.github_user from purchases x join products p on p.id = x.product_id
     where x.id = $1 and x.buyer = $2 and x.status = 'paid' and p.kind = 'github'`,
    [id, buyer],
  );
  if (!row?.github_repo) return Response.json({ error: "no paid purchase found" }, { status: 404 });
  if (row.github_user && row.github_user.toLowerCase() !== username.toLowerCase()) {
    return Response.json({ error: `this purchase is already tied to GitHub user ${row.github_user}` }, { status: 409 });
  }

  const error = await inviteCollaborator(row.github_repo, unwrapKey(row.wrapped_key, masterKey()).toString(), username);
  if (error) return Response.json({ error }, { status: 502 });
  await query(`update purchases set github_user = $1 where id = $2`, [username, id]);
  return Response.json({ ok: true, repo: row.github_repo });
}
