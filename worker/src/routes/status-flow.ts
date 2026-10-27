import { Hono } from "hono";
import type { AppBindings } from "../env";

export type StatusFlowRow = {
  user_id: string;
  From: string;
  To: string;
  Weight: number;
};

export const statusFlow = new Hono<AppBindings>();

statusFlow.get("/api/status-flow", async (c) => {
  // application_status_flow is the aggregate view created by the migration.
  const { results } = await c.env.DB.prepare("SELECT * FROM application_status_flow WHERE user_id = ?")
    .bind(c.get("userId"))
    .all<StatusFlowRow>();

  return c.json(results);
});
