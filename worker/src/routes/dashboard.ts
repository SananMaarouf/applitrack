import { Hono } from "hono";
import { z } from "zod";
import type { AppBindings } from "../env";
import { unprocessable, validationMessage } from "../lib/http";
import { getDashboardTrends } from "../services/trends";

const periodSchema = z.enum(["week", "month"]);

export const dashboard = new Hono<AppBindings>();

dashboard.get("/api/dashboard/trends", async (c) => {
  const raw = c.req.query("period") ?? "week";
  const parsed = periodSchema.safeParse(raw);
  if (!parsed.success) return unprocessable(c, validationMessage(parsed.error));

  return c.json(await getDashboardTrends(c.env.DB, c.get("userId"), parsed.data));
});
