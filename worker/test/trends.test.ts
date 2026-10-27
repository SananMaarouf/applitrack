/**
 * Port of backend/tests/test_trends.py: unit tests for the trend maths plus
 * endpoint tests against seeded D1 data.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildTrendWindows, computeTrend, fetchTrendCounts } from "../src/services/trends";
import { env } from "cloudflare:test";
import { TOKEN_A, USER_A, api, isoDaysAgo, resetAttachments, resetDatabase, seedApplications } from "./helpers";

beforeEach(resetDatabase);
afterEach(resetAttachments);

describe("computeTrend", () => {
  it("reports an upward trend", () => {
    const metric = computeTrend(10, 5);
    expect(metric).toMatchObject({ current: 10, previous: 5, difference: 5, percentChange: 100, direction: "up" });
  });

  it("reports a downward trend", () => {
    const metric = computeTrend(3, 6);
    expect(metric).toMatchObject({ difference: -3, percentChange: -50, direction: "down" });
  });

  it("reports a neutral trend", () => {
    const metric = computeTrend(4, 4);
    expect(metric).toMatchObject({ difference: 0, percentChange: 0, direction: "neutral" });
  });

  it("rounds the percentage change to one decimal", () => {
    // ((10 - 3) / 3) * 100 = 233.333… → 233.3
    expect(computeTrend(10, 3).percentChange).toBe(233.3);
  });

  it("returns null percent change when the previous period was empty", () => {
    const metric = computeTrend(7, 0);
    expect(metric.percentChange).toBeNull();
    expect(metric.direction).toBe("up");
    expect(metric.difference).toBe(7);
  });

  it("returns zero percent change when both periods are empty", () => {
    const metric = computeTrend(0, 0);
    expect(metric.percentChange).toBe(0);
    expect(metric.direction).toBe("neutral");
  });
});

describe("buildTrendWindows", () => {
  const now = new Date("2025-06-15T12:00:00.000Z");
  const DAY = 24 * 60 * 60 * 1000;

  it("spans seven days for the week period", () => {
    const windows = buildTrendWindows("week", now);
    expect(windows.current.end.getTime()).toBe(now.getTime());
    expect(windows.current.start.getTime()).toBe(now.getTime() - 7 * DAY);
    expect(windows.previous.start.getTime()).toBe(now.getTime() - 14 * DAY);
  });

  it("spans thirty days for the month period", () => {
    const windows = buildTrendWindows("month", now);
    expect(windows.current.start.getTime()).toBe(now.getTime() - 30 * DAY);
    expect(windows.previous.start.getTime()).toBe(now.getTime() - 60 * DAY);
  });

  it("keeps the windows contiguous", () => {
    for (const period of ["week", "month"] as const) {
      const windows = buildTrendWindows(period, now);
      expect(windows.previous.end.getTime()).toBe(windows.current.start.getTime());
    }
  });

  it("defaults to the current time", () => {
    const before = Date.now();
    const windows = buildTrendWindows("week");
    const after = Date.now();
    expect(windows.current.end.getTime()).toBeGreaterThanOrEqual(before);
    expect(windows.current.end.getTime()).toBeLessThanOrEqual(after);
  });
});

describe("fetchTrendCounts", () => {
  it("counts only the requested user's applications", async () => {
    const now = new Date();
    await seedApplications([{ daysAgo: 1, status: 1 }], USER_A);
    await seedApplications([{ daysAgo: 1, status: 1 }], "user_other");

    const counts = await fetchTrendCounts(env.DB, USER_A, buildTrendWindows("week", now));
    expect(counts).toMatchObject({ currentApps: 1, previousApps: 0 });
  });

  it("treats statuses 2, 3 and 4 as interviews", async () => {
    await seedApplications(
      [1, 2, 3, 4, 5, 6, 7].map((status) => ({ daysAgo: 1, status })),
      USER_A,
    );

    const counts = await fetchTrendCounts(env.DB, USER_A, buildTrendWindows("week", new Date()));
    expect(counts).toMatchObject({ currentApps: 7, currentInterviews: 3 });
  });

  it("counts applications in the previous window separately", async () => {
    const windows = buildTrendWindows("week", new Date());
    await env.DB.prepare(
      `INSERT INTO applications (user_id, position, company, applied_at, status)
       VALUES (?, 'P', 'C', ?, 1)`,
    )
      .bind(USER_A, isoDaysAgo(9))
      .run();

    const counts = await fetchTrendCounts(env.DB, USER_A, windows);
    expect(counts).toMatchObject({ currentApps: 0, previousApps: 1 });
  });
});

describe("GET /dashboard/trends", () => {
  type Metric = { current: number; previous: number; difference: number; percentChange: number | null; direction: string };
  type TrendBody = {
    period: "week" | "month";
    ranges: { current_start: string; current_end: string; previous_start: string; previous_end: string };
    applications_sent: Metric;
    interviews: Metric;
  };

  it("rejects an unknown period", async () => {
    const response = await api("/dashboard/trends?period=year", { token: TOKEN_A });
    expect(response.status).toBe(422);
  });

  it("defaults to the week period", async () => {
    const response = await api("/dashboard/trends", { token: TOKEN_A });
    expect(response.status).toBe(200);
    expect(((await response.json()) as TrendBody).period).toBe("week");
  });

  it("returns the documented response shape", async () => {
    await seedApplications();
    const body = (await (await api("/dashboard/trends?period=week", { token: TOKEN_A })).json()) as TrendBody;

    expect(Object.keys(body.ranges).sort()).toEqual(
      ["current_end", "current_start", "previous_end", "previous_start"].sort(),
    );
    for (const metric of [body.applications_sent, body.interviews]) {
      // percentChange is a number or null (null when the previous window is empty).
      expect(Object.keys(metric).sort()).toEqual(
        ["current", "difference", "direction", "percentChange", "previous"],
      );
      expect(typeof metric.current).toBe("number");
      expect(typeof metric.previous).toBe("number");
      expect(typeof metric.difference).toBe("number");
      expect(metric.percentChange === null || typeof metric.percentChange === "number").toBe(true);
      expect(["up", "down", "neutral"]).toContain(metric.direction);
    }
    expect(body.ranges.current_start).toMatch(/Z$/);
  });

  it("keeps difference and direction consistent with the counts", async () => {
    await seedApplications();
    const body = (await (await api("/dashboard/trends?period=week", { token: TOKEN_A })).json()) as TrendBody;

    for (const metric of [body.applications_sent, body.interviews]) {
      expect(metric.difference).toBe(metric.current - metric.previous);
      const expected = metric.current > metric.previous ? "up" : metric.current < metric.previous ? "down" : "neutral";
      expect(metric.direction).toBe(expected);
    }
  });

  it("counts exactly the seeded application inside the week window", async () => {
    await seedApplications();
    const body = (await (await api("/dashboard/trends?period=week", { token: TOKEN_A })).json()) as TrendBody;

    expect(body.applications_sent.current).toBe(1);
    expect(body.interviews.current).toBe(1);
  });

  it("counts the seeded applications inside the month window", async () => {
    await seedApplications();
    const body = (await (await api("/dashboard/trends?period=month", { token: TOKEN_A })).json()) as TrendBody;

    // Four of the five seeds are inside 30 days for certain; the fifth sits on
    // the exact boundary, so only a lower bound is asserted.
    expect(body.applications_sent.current).toBeGreaterThanOrEqual(4);
    expect(body.interviews.current).toBeGreaterThanOrEqual(1);
  });

  it("does not leak another user's applications", async () => {
    await seedApplications();
    const body = (await (await api("/dashboard/trends?period=month", { token: "user-b-token" })).json()) as TrendBody;

    expect(body.applications_sent.current).toBe(0);
    expect(body.interviews.current).toBe(0);
  });
});
