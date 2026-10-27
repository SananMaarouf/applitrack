/**
 * Port of the old pytest suite (backend/tests/test_applications.py, `self-host`
 * branch) against the Worker + D1 stack.
 *
 * Categories mirror the pytest suite: authentication, health, CRUD, status
 * transition rules, user isolation, the status-flow view, and status-history
 * bookkeeping.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  TOKEN_A,
  TOKEN_B,
  USER_A,
  USER_B,
  api,
  applicationStatus,
  createApplication,
  historyRows,
  resetAttachments,
  resetDatabase,
  seedApplications,
} from "./helpers";

beforeEach(resetDatabase);
afterEach(resetAttachments);

type ApplicationBody = {
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

describe("authentication", () => {
  it.each([
    ["GET", "/applications"],
    ["GET", "/status-flow"],
    ["GET", "/dashboard/trends"],
    ["PATCH", "/applications/999/status"],
    ["DELETE", "/applications/999"],
  ])("%s %s requires a bearer token", async (method, path) => {
    const response = await api(path, { method, ...(method === "PATCH" ? { body: JSON.stringify({ new_status: 2 }) } : {}) });
    expect(response.status).toBe(401);
  });

  it("rejects a request with an empty bearer token", async () => {
    const response = await api("/applications", { headers: { Authorization: "Bearer " } });
    expect(response.status).toBe(401);
  });
});

describe("health", () => {
  it("reports ok without authentication", async () => {
    const response = await api("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});

describe("application CRUD", () => {
  it("returns an empty list for a user with no applications", async () => {
    const response = await api("/applications", { token: TOKEN_A });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("creates an application that starts in the Applied status", async () => {
    const response = await api("/applications", {
      method: "POST",
      token: TOKEN_A,
      body: JSON.stringify({
        position: "Software Engineer",
        company: "Test Corp",
        applied_at: "2025-01-15T10:00:00",
        link: "https://testcorp.example.com/jobs/1",
      }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as ApplicationBody;

    expect(body.position).toBe("Software Engineer");
    expect(body.company).toBe("Test Corp");
    expect(body.status).toBe(1);
    expect(body.link).toBe("https://testcorp.example.com/jobs/1");
    expect(body.user_id).toBe(USER_A);
    expect(body.attachment_key).toBeNull();
    expect(Number.isInteger(body.id)).toBe(true);
    // Naive input is treated as UTC and returned with an explicit zone.
    expect(body.applied_at).toBe("2025-01-15T10:00:00.000Z");
    expect(body.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("stores the optional expiry date", async () => {
    const id = await createApplication(TOKEN_A, {
      expires_at: "2025-04-30T12:00:00Z",
    });

    const listed = (await (await api("/applications", { token: TOKEN_A })).json()) as ApplicationBody[];
    const created = listed.find((row) => row.id === id)!;
    expect(created.expires_at).toBe("2025-04-30T12:00:00.000Z");
  });

  it("lists a newly created application, newest first", async () => {
    const first = await createApplication(TOKEN_A, { position: "First" });
    const second = await createApplication(TOKEN_A, { position: "Second" });

    const response = await api("/applications", { token: TOKEN_A });
    expect(response.status).toBe(200);
    const rows = (await response.json()) as ApplicationBody[];

    expect(rows.map((row) => row.id)).toEqual([second, first]);
  });

  it("deletes an application", async () => {
    const id = await createApplication(TOKEN_A);

    const response = await api(`/applications/${id}`, { method: "DELETE", token: TOKEN_A });
    expect(response.status).toBe(204);

    const rows = (await (await api("/applications", { token: TOKEN_A })).json()) as ApplicationBody[];
    expect(rows.map((row) => row.id)).not.toContain(id);
  });

  it("returns 204 when deleting an application that does not exist", async () => {
    const response = await api("/applications/999999999", { method: "DELETE", token: TOKEN_A });
    expect(response.status).toBe(204);
  });

  it("rejects a payload missing required fields", async () => {
    const response = await api("/applications", {
      method: "POST",
      token: TOKEN_A,
      body: JSON.stringify({ company: "No Position Corp" }),
    });
    expect(response.status).toBe(422);
  });

  it("rejects a non ISO applied_at value", async () => {
    const response = await api("/applications", {
      method: "POST",
      token: TOKEN_A,
      body: JSON.stringify({ position: "P", company: "C", applied_at: "not-a-date" }),
    });
    expect(response.status).toBe(422);
  });

  it("rejects malformed JSON", async () => {
    const response = await api("/applications", { method: "POST", token: TOKEN_A, body: "{oops" });
    expect(response.status).toBe(400);
  });
});

describe("status transitions", () => {
  async function patchStatus(id: number, newStatus: number, token = TOKEN_A): Promise<Response> {
    return api(`/applications/${id}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ new_status: newStatus }),
    });
  }

  it("allows a single forward step", async () => {
    const id = await createApplication();
    const response = await patchStatus(id, 2);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Status updated successfully" });
    expect(await applicationStatus(id)).toBe(2);
  });

  it("rejects skipping a step", async () => {
    const id = await createApplication();
    const response = await patchStatus(id, 3);

    expect(response.status).toBe(400);
    expect(((await response.json()) as { detail: string }).detail).toContain("Cannot skip steps");
    expect(await applicationStatus(id)).toBe(1);
  });

  it("rejects setting the status a row already has", async () => {
    const id = await createApplication();
    const response = await patchStatus(id, 1);

    expect(response.status).toBe(400);
    expect(((await response.json()) as { detail: string }).detail).toBe("Status is already set to this value");
  });

  it("allows jumping to a terminal status", async () => {
    const id = await createApplication();
    await patchStatus(id, 2);

    const response = await patchStatus(id, 5);
    expect(response.status).toBe(200);
    expect(((await response.json()) as { message: string }).message).toBe("Status updated successfully");
    expect(await applicationStatus(id)).toBe(5);
  });

  it("allows a direct jump to Rejected or Ghosted", async () => {
    const rejected = await createApplication();
    expect((await patchStatus(rejected, 6)).status).toBe(200);

    const ghosted = await createApplication();
    expect((await patchStatus(ghosted, 7)).status).toBe(200);
  });

  it("refuses to leave a terminal status without a reset", async () => {
    const id = await createApplication();
    await patchStatus(id, 6);

    const response = await patchStatus(id, 2);
    expect(response.status).toBe(400);
    expect(((await response.json()) as { detail: string }).detail).toContain('Cannot change from terminal status "Rejected"');
    expect(await applicationStatus(id)).toBe(6);
  });

  it("resets to Applied and clears the history", async () => {
    const id = await createApplication();
    await patchStatus(id, 2);
    await patchStatus(id, 6);
    expect(await historyRows(id)).toHaveLength(2);

    const response = await patchStatus(id, 1);
    expect(response.status).toBe(200);
    expect(((await response.json()) as { message: string }).message).toBe(
      "Application status reset to Applied (history cleared)",
    );
    expect(await applicationStatus(id)).toBe(1);
    expect(await historyRows(id)).toEqual([]);
  });

  it("rejects a status outside 1..7", async () => {
    const id = await createApplication();
    const response = await patchStatus(id, 99);
    expect(response.status).toBe(422);
  });

  it("returns 404 for an unknown application", async () => {
    const response = await patchStatus(999999999, 2);
    expect(response.status).toBe(404);
  });

  it("returns 422 for a non-numeric application id", async () => {
    const response = await api("/applications/abc/status", {
      method: "PATCH",
      token: TOKEN_A,
      body: JSON.stringify({ new_status: 2 }),
    });
    expect(response.status).toBe(422);
  });
});

describe("status history bookkeeping", () => {
  async function patchStatus(id: number, newStatus: number): Promise<void> {
    const response = await api(`/applications/${id}/status`, {
      method: "PATCH",
      token: TOKEN_A,
      body: JSON.stringify({ new_status: newStatus }),
    });
    expect(response.status).toBe(200);
  }

  it("records nothing until the status changes", async () => {
    const id = await createApplication();
    expect(await historyRows(id)).toEqual([]);
  });

  it("records each forward step exactly once", async () => {
    const id = await createApplication();
    await patchStatus(id, 2);
    await patchStatus(id, 3);

    expect((await historyRows(id)).map(({ from_status, to_status }) => [from_status, to_status])).toEqual([
      [1, 2],
      [2, 3],
    ]);
  });

  it("drops the undone step when the status is corrected downwards", async () => {
    const id = await createApplication();
    await patchStatus(id, 2);
    await patchStatus(id, 3);
    await patchStatus(id, 2); // correction

    expect((await historyRows(id)).map(({ from_status, to_status }) => [from_status, to_status])).toEqual([[1, 2]]);
    expect(await applicationStatus(id)).toBe(2);
  });

  it("rewrites the last transition when switching between terminal statuses", async () => {
    const id = await createApplication();
    await patchStatus(id, 2);
    await patchStatus(id, 6);
    await patchStatus(id, 5); // corrected outcome

    expect((await historyRows(id)).map(({ from_status, to_status }) => [from_status, to_status])).toEqual([
      [1, 2],
      [2, 5],
    ]);
    expect(await applicationStatus(id)).toBe(5);
  });

  it("removes history rows when the application is deleted", async () => {
    const id = await createApplication();
    await patchStatus(id, 2);
    expect(await historyRows(id)).toHaveLength(1);

    const response = await api(`/applications/${id}`, { method: "DELETE", token: TOKEN_A });
    expect(response.status).toBe(204);
    expect(await historyRows(id)).toEqual([]);
  });
});

describe("user isolation", () => {
  it("does not list another user's applications", async () => {
    const id = await createApplication(TOKEN_A);

    const rows = (await (await api("/applications", { token: TOKEN_B })).json()) as ApplicationBody[];
    expect(rows.map((row) => row.id)).not.toContain(id);
  });

  it("returns 404 when patching another user's application", async () => {
    const id = await createApplication(TOKEN_A);

    const response = await api(`/applications/${id}/status`, {
      method: "PATCH",
      token: TOKEN_B,
      body: JSON.stringify({ new_status: 2 }),
    });
    expect(response.status).toBe(404);
    expect(await applicationStatus(id)).toBe(1);
  });

  it("does not delete another user's application", async () => {
    const id = await createApplication(TOKEN_A);

    const response = await api(`/applications/${id}`, { method: "DELETE", token: TOKEN_B });
    expect(response.status).toBe(204);
    expect(await applicationStatus(id)).toBe(1);
  });
});

describe("status flow", () => {
  type FlowRow = { user_id: string; From: string; To: string; Weight: number };

  it("is empty for a user with no history", async () => {
    const response = await api("/status-flow", { token: TOKEN_A });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("aggregates transitions by from/to pair", async () => {
    await seedApplications();

    const response = await api("/status-flow", { token: TOKEN_A });
    expect(response.status).toBe(200);
    const rows = (await response.json()) as FlowRow[];

    expect(rows.every((row) => row.user_id === USER_A)).toBe(true);
    expect(rows.find((row) => row.From === "Applied" && row.To === "Interview")!.Weight).toBe(4);
    expect(rows.find((row) => row.From === "Interview" && row.To === "Second Interview")!.Weight).toBe(2);
    expect(rows.find((row) => row.From === "Interview" && row.To === "Rejected")!.Weight).toBe(1);
  });

  it("keeps other users' transitions out of the result", async () => {
    await seedApplications();
    await seedApplications([{ history: [[1, 2]] }], USER_B);

    const rows = (await (await api("/status-flow", { token: TOKEN_B })).json()) as FlowRow[];
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ user_id: USER_B, From: "Applied", To: "Interview", Weight: 1 });
  });
});
