import type { Context } from "hono";
import type { ZodError } from "zod";

export function validationMessage(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request body";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}

/** 422 with the same `detail` shape the FastAPI backend used. */
export function unprocessable(c: Context, message: string): Response {
  return c.json({ detail: message }, 422);
}

export function badRequest(c: Context, message: string): Response {
  return c.json({ detail: message }, 400);
}

export function notFound(c: Context, message = "Not found"): Response {
  return c.json({ detail: message }, 404);
}

export function parseId(raw: string | undefined): number | null {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}
