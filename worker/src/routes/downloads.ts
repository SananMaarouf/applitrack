import { Hono } from "hono";
import type { AppBindings } from "../env";
import { notFound, parseId } from "../lib/http";
import { ALLOWED_CONTENT_TYPE, verifyAttachmentSignature } from "../services/attachments";

export const downloads = new Hono<AppBindings>();

/**
 * Signed, cookie-free download. The signature covers the application id and the
 * expiry, so it needs no Authorization header — the frontend opens this URL in
 * a new tab after asking the API for it.
 */
downloads.get("/api/attachments/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) return notFound(c, "Not found");

  const env = c.env;
  const secret = env.ATTACHMENT_SIGNING_KEY;
  if (!secret) return c.json({ detail: "Attachment downloads are not configured" }, 500);

  const expires = Number(c.req.query("exp"));
  const signature = c.req.query("sig") ?? "";
  if (!signature || !(await verifyAttachmentSignature(secret, id, expires, signature))) {
    return c.json({ detail: "Invalid or expired link" }, 403);
  }

  const row = await env.DB.prepare("SELECT attachment_key FROM applications WHERE id = ?")
    .bind(id)
    .first<{ attachment_key: string | null }>();

  if (!row?.attachment_key) return notFound(c, "No attachment found");

  const object = await env.ATTACHMENTS.get(row.attachment_key);
  if (!object) return notFound(c, "No attachment found");

  const filename = row.attachment_key.split("/").pop() ?? "attachment.pdf";

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? ALLOWED_CONTENT_TYPE,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
});
