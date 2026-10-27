const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const HAS_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Normalise a client-supplied datetime to fixed-width ISO-8601 UTC.
 *
 * The FastAPI backend stored timezone-naive values and returned them without a
 * "Z", which browsers then parsed as local time. Everything here is UTC: a
 * value without an explicit zone is treated as UTC, and the result always ends
 * with milliseconds and a "Z" so lexical order equals chronological order in
 * D1 and every string is the same length.
 *
 * Returns null when the value cannot be parsed.
 */
export function normalizeDateTime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const candidate = DATE_ONLY.test(trimmed)
    ? `${trimmed}T00:00:00.000Z`
    : HAS_ZONE.test(trimmed)
      ? trimmed
      : `${trimmed}Z`;

  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function toIso(date: Date): string {
  return date.toISOString();
}
