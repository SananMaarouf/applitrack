import { Hono } from "hono";
import { z } from "zod";
import type { AppBindings } from "../env";
import { badRequest, notFound, parseId, unprocessable, validationMessage } from "../lib/http";
import { normalizeDateTime } from "../lib/time";
import { validateStatusTransition } from "../lib/status";
import {
  ALLOWED_CONTENT_TYPE,
  MAX_ATTACHMENT_SIZE,
  attachmentKey,
  signAttachmentUrl,
} from "../services/attachments";

export type ApplicationRow = {
  id: number;
  created_at: string;
  user_id: string;
  applied_at: string;
  expires_at: string | null;
  position: string;
  company: string;
  status: number;
  link: string | null;
  attachment_key: string | null;
};

const COLUMNS = "id, created_at, user_id, applied_at, expires_at, position, company, status, link, attachment_key";

const dateTimeString = z
  .string()
  .refine((value) => normalizeDateTime(value) !== null, { message: "must be an ISO 8601 datetime" });

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * `new Date` rolls impossible days (for example 2025-02-30) into the next
 * month, so metadata edits check the literal calendar components as well.
 */
function isStrictDateTime(value: string): boolean {
  if (normalizeDateTime(value) === null) return false;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ]|$)/);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

const patchDateTimeString = z
  .string()
  .refine(isStrictDateTime, { message: "must be an ISO 8601 datetime with a valid calendar date" });

const createSchema = z.object({
  position: z.string(),
  company: z.string(),
  applied_at: dateTimeString,
  expires_at: dateTimeString.nullish(),
  link: z.string().nullish(),
});

const updateSchema = z
  .object({
    position: z.string().min(1, { message: "must not be empty" }).optional(),
    company: z.string().min(1, { message: "must not be empty" }).optional(),
    applied_at: patchDateTimeString.optional(),
    expires_at: patchDateTimeString.nullable().optional(),
    link: z
      .string()
      .nullable()
      .optional()
      .refine((value) => value == null || isHttpUrl(value), {
        message: "must be an absolute http(s) URL",
      }),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

const statusSchema = z.object({
  new_status: z.coerce.number().int().min(1).max(7),
});

async function findApplication(db: D1Database, id: number, userId: string): Promise<ApplicationRow | null> {
  return db
    .prepare(`SELECT ${COLUMNS} FROM applications WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .first<ApplicationRow>();
}

async function readJson(request: Request): Promise<{ ok: true; value: unknown } | { ok: false }> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false };
  }
}

export const applications = new Hono<AppBindings>();

applications.get("/api/applications", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ${COLUMNS} FROM applications WHERE user_id = ? ORDER BY created_at DESC, id DESC`,
  )
    .bind(c.get("userId"))
    .all<ApplicationRow>();

  return c.json(results);
});

applications.post("/api/applications", async (c) => {
  const body = await readJson(c.req.raw);
  if (!body.ok) return badRequest(c, "Invalid JSON body");

  const parsed = createSchema.safeParse(body.value);
  if (!parsed.success) return unprocessable(c, validationMessage(parsed.error));

  const row = await c.env.DB.prepare(
    `INSERT INTO applications (user_id, position, company, applied_at, expires_at, link, status)
     VALUES (?, ?, ?, ?, ?, ?, 1)
     RETURNING ${COLUMNS}`,
  )
    .bind(
      c.get("userId"),
      parsed.data.position,
      parsed.data.company,
      normalizeDateTime(parsed.data.applied_at),
      parsed.data.expires_at ? normalizeDateTime(parsed.data.expires_at) : null,
      parsed.data.link ?? null,
    )
    .first<ApplicationRow>();

  return c.json(row, 201);
});

applications.patch("/api/applications/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) return unprocessable(c, "id: must be an integer");

  const userId = c.get("userId");
  const application = await findApplication(c.env.DB, id, userId);
  if (!application) return notFound(c, "Application not found");

  const body = await readJson(c.req.raw);
  if (!body.ok) return badRequest(c, "Invalid JSON body");

  const parsed = updateSchema.safeParse(body.value);
  if (!parsed.success) return unprocessable(c, validationMessage(parsed.error));

  const assignments: string[] = [];
  const values: (string | null)[] = [];

  // Static assignment fragments only: user input is always bound as a value.
  if (parsed.data.position !== undefined) {
    assignments.push("position = ?");
    values.push(parsed.data.position);
  }
  if (parsed.data.company !== undefined) {
    assignments.push("company = ?");
    values.push(parsed.data.company);
  }
  if (parsed.data.applied_at !== undefined) {
    assignments.push("applied_at = ?");
    values.push(normalizeDateTime(parsed.data.applied_at));
  }
  if (parsed.data.expires_at !== undefined) {
    assignments.push("expires_at = ?");
    values.push(parsed.data.expires_at === null ? null : normalizeDateTime(parsed.data.expires_at));
  }
  if (parsed.data.link !== undefined) {
    assignments.push("link = ?");
    values.push(parsed.data.link);
  }

  const row = await c.env.DB.prepare(
    `UPDATE applications SET ${assignments.join(", ")}
     WHERE id = ? AND user_id = ?
     RETURNING ${COLUMNS}`,
  )
    .bind(...values, id, userId)
    .first<ApplicationRow>();

  if (!row) return notFound(c, "Application not found");
  return c.json(row);
});

applications.patch("/api/applications/:id/status", async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) return unprocessable(c, "id: must be an integer");

  const userId = c.get("userId");
  const application = await findApplication(c.env.DB, id, userId);
  if (!application) return notFound(c, "Application not found");

  const body = await readJson(c.req.raw);
  if (!body.ok) return badRequest(c, "Invalid JSON body");

  const parsed = statusSchema.safeParse(body.value);
  if (!parsed.success) return unprocessable(c, validationMessage(parsed.error));

  const newStatus = parsed.data.new_status;
  const validation = validateStatusTransition(application.status, newStatus);
  if (!validation.isValid) return c.json({ detail: validation.message }, 400);

  const updateStatus = c.env.DB.prepare(
    "UPDATE applications SET status = ? WHERE id = ? AND user_id = ?",
  ).bind(newStatus, id, userId);

  const db = c.env.DB;
  const latestHistoryRow = `SELECT id FROM application_status_history
                            WHERE application_id = ? AND user_id = ?
                            ORDER BY id DESC LIMIT 1`;

  // No trigger here: each case below writes the history rows it wants, and the
  // batch keeps the status change and the history change atomic.
  switch (validation.transitionType) {
    case "reset":
      await db.batch([
        updateStatus,
        db.prepare("DELETE FROM application_status_history WHERE application_id = ? AND user_id = ?").bind(id, userId),
      ]);
      break;

    case "terminal_switch":
      // Correcting the outcome of a finished application rewrites the last
      // recorded transition rather than appending a new one.
      await db.batch([
        updateStatus,
        db.prepare(`UPDATE application_status_history SET to_status = ? WHERE id = (${latestHistoryRow})`).bind(
          newStatus,
          id,
          userId,
        ),
      ]);
      break;

    case "correction":
      // Stepping backwards undoes the most recent transition.
      await db.batch([
        db.prepare(`DELETE FROM application_status_history WHERE id = (${latestHistoryRow})`).bind(id, userId),
        updateStatus,
      ]);
      break;

    default:
      // forward: one history row per step.
      await db.batch([
        updateStatus,
        db.prepare(
          `INSERT INTO application_status_history (application_id, user_id, from_status, to_status)
           VALUES (?, ?, ?, ?)`,
        ).bind(id, userId, application.status, newStatus),
      ]);
      break;
  }

  return c.json({ message: validation.message });
});

applications.delete("/api/applications/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) return unprocessable(c, "id: must be an integer");

  const userId = c.get("userId");
  const application = await findApplication(c.env.DB, id, userId);

  if (application?.attachment_key) {
    try {
      await c.env.ATTACHMENTS.delete(application.attachment_key);
    } catch (error) {
      // Attachment cleanup must not block deleting the row.
      console.warn("Failed to delete attachment from R2", error);
    }
  }

  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM application_status_history WHERE application_id = ? AND user_id = ?").bind(id, userId),
    c.env.DB.prepare("DELETE FROM applications WHERE id = ? AND user_id = ?").bind(id, userId),
  ]);

  return c.body(null, 204);
});

applications.post("/api/applications/:id/attachment", async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) return unprocessable(c, "id: must be an integer");

  const userId = c.get("userId");
  const application = await findApplication(c.env.DB, id, userId);
  if (!application) return notFound(c, "Application not found");

  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return badRequest(c, "Expected multipart/form-data with a file field");
  }

  const file = form.get("file");
  if (!(file instanceof File)) return unprocessable(c, "file: a PDF file is required");
  if (file.type !== ALLOWED_CONTENT_TYPE) return c.json({ detail: "Only PDF files are allowed" }, 415);
  if (file.size > MAX_ATTACHMENT_SIZE) return c.json({ detail: "File exceeds the 10 MB limit" }, 413);

  const key = attachmentKey(userId, id, file.name || "attachment.pdf");

  // Write the replacement first. The old object stays readable until the new
  // one is safely stored and the row points at it, so a failed R2 write cannot
  // destroy the user's existing PDF.
  await c.env.ATTACHMENTS.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: ALLOWED_CONTENT_TYPE },
  });

  const row = await c.env.DB.prepare(
    `UPDATE applications SET attachment_key = ? WHERE id = ? AND user_id = ? RETURNING ${COLUMNS}`,
  )
    .bind(key, id, userId)
    .first<ApplicationRow>();

  const previousKey = application.attachment_key;
  if (previousKey && previousKey !== key && row?.attachment_key === key) {
    try {
      await c.env.ATTACHMENTS.delete(previousKey);
    } catch (error) {
      // Cleanup is best effort; the new attachment and row are already valid.
      console.warn("Failed to delete replaced attachment from R2", error);
    }
  }

  return c.json(row);
});

applications.get("/api/applications/:id/attachment/url", async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) return unprocessable(c, "id: must be an integer");

  const application = await findApplication(c.env.DB, id, c.get("userId"));
  if (!application) return notFound(c, "Application not found");
  if (!application.attachment_key) return notFound(c, "No attachment found");

  const secret = c.env.ATTACHMENT_SIGNING_KEY;
  if (!secret) return c.json({ detail: "Attachment downloads are not configured" }, 500);

  return c.json({ url: await signAttachmentUrl(secret, id) });
});

applications.delete("/api/applications/:id/attachment", async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) return unprocessable(c, "id: must be an integer");

  const userId = c.get("userId");
  const application = await findApplication(c.env.DB, id, userId);
  if (!application) return notFound(c, "Application not found");
  if (!application.attachment_key) return notFound(c, "No attachment found");

  await c.env.ATTACHMENTS.delete(application.attachment_key);
  await c.env.DB.prepare("UPDATE applications SET attachment_key = NULL WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .run();

  return c.body(null, 204);
});
