import { env, SELF } from "cloudflare:test";

/** Static identities handed out by the test-mode auth branch. */
export const USER_A = "user_a";
export const USER_B = "user_b";
export const TOKEN_A = "user-a-token";
export const TOKEN_B = "user-b-token";

type ApiInit = Omit<RequestInit, "headers"> & {
  token?: string | null;
  headers?: Record<string, string>;
};

/** Issue a request against the Worker's /api routes. */
export function api(path: string, init: ApiInit = {}): Promise<Response> {
  const { token, headers, ...rest } = init;
  const finalHeaders: Record<string, string> = { ...(headers ?? {}) };

  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  if (rest.body !== undefined && !(rest.body instanceof FormData) && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  return SELF.fetch(`http://example.com/api${path}`, { ...rest, headers: finalHeaders });
}

export async function resetDatabase(): Promise<void> {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM application_status_history"),
    env.DB.prepare("DELETE FROM applications"),
  ]);
}

export async function resetAttachments(): Promise<void> {
  const listed = await env.ATTACHMENTS.list();
  if (listed.objects.length > 0) {
    await env.ATTACHMENTS.delete(listed.objects.map((object: R2Object) => object.key));
  }
}

export function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export type SeedSpec = {
  position?: string;
  company?: string;
  daysAgo?: number;
  status?: number;
  link?: string | null;
  history?: [number, number][];
};

/**
 * Mirrors the old suite's _SEED_APPS (backend/tests/conftest.py, `self-host`
 * branch): five applications spread over
 * the last 30 days, three of which carry interview-stage statuses.
 */
export const SEED_APPS: SeedSpec[] = [
  { position: "Software Engineer", company: "Acme Corp", daysAgo: 30, status: 2, link: "https://acme.example.com/jobs/1", history: [[1, 2]] },
  { position: "Backend Developer", company: "Globex", daysAgo: 20, status: 5, link: null, history: [[1, 2], [2, 3], [3, 4], [4, 5]] },
  { position: "Data Engineer", company: "Initech", daysAgo: 15, status: 6, link: "https://initech.example.com/jobs/42", history: [[1, 2], [2, 6]] },
  { position: "DevOps Engineer", company: "Umbrella Ltd", daysAgo: 10, status: 1, link: null, history: [] },
  { position: "ML Engineer", company: "Skynet AI", daysAgo: 5, status: 3, link: "https://skynetai.example.com/jobs/7", history: [[1, 2], [2, 3]] },
];

export async function seedApplications(
  specs: SeedSpec[] = SEED_APPS,
  userId: string = USER_A,
): Promise<number[]> {
  const ids: number[] = [];

  for (const spec of specs) {
    const row = await env.DB.prepare(
      `INSERT INTO applications (user_id, position, company, applied_at, status, link)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id`,
    )
      .bind(
        userId,
        spec.position ?? "Engineer",
        spec.company ?? "Corp",
        isoDaysAgo(spec.daysAgo ?? 1),
        spec.status ?? 1,
        spec.link ?? null,
      )
      .first<{ id: number }>();

    const id = row!.id;
    ids.push(id);

    for (const [from, to] of spec.history ?? []) {
      await env.DB.prepare(
        `INSERT INTO application_status_history (application_id, user_id, from_status, to_status)
         VALUES (?, ?, ?, ?)`,
      )
        .bind(id, userId, from, to)
        .run();
    }
  }

  return ids;
}

export type HistoryRow = { id: number; from_status: number; to_status: number };

export async function historyRows(applicationId: number): Promise<HistoryRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT id, from_status, to_status FROM application_status_history
     WHERE application_id = ? ORDER BY id`,
  )
    .bind(applicationId)
    .all<HistoryRow>();
  return results;
}

export async function applicationStatus(applicationId: number): Promise<number | null> {
  const row = await env.DB.prepare("SELECT status FROM applications WHERE id = ?")
    .bind(applicationId)
    .first<{ status: number }>();
  return row?.status ?? null;
}

export async function createApplication(
  token: string = TOKEN_A,
  overrides: Record<string, unknown> = {},
): Promise<number> {
  const response = await api("/applications", {
    method: "POST",
    token,
    body: JSON.stringify({
      position: "Status Test Engineer",
      company: "Status Corp",
      applied_at: "2025-04-01T00:00:00Z",
      ...overrides,
    }),
  });
  if (response.status !== 201) {
    throw new Error(`create failed: ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { id: number };
  return body.id;
}
