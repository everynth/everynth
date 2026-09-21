import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { MAX_PAYLOAD_BYTES } from "@/lib/config";
import { sessionWallet } from "@/lib/session";

// Hands the creator's browser a short-lived token to upload the (already encrypted) file straight to
// Vercel Blob, so big files never pass through this server. Only the ciphertext ever lands there.
export async function POST(request: Request) {
  const wallet = await sessionWallet();
  if (!wallet) return Response.json({ error: "sign in first" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return Response.json({ error: "bad request" }, { status: 400 });
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["application/octet-stream"],
        maximumSizeInBytes: MAX_PAYLOAD_BYTES + 28, // ciphertext = 12-byte iv + plaintext + 16-byte tag
        addRandomSuffix: true,
        tokenPayload: wallet,
      }),
      onUploadCompleted: async () => {}, // the product row is written by POST /api/products afterwards
    });
    return Response.json(json);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "upload failed" }, { status: 400 });
  }
}
