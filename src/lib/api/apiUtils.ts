export function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function cleanNullableString(value: unknown): string | null {
  const cleaned = cleanString(value);

  return cleaned || null;
}

export function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function cleanSlug(value: unknown): string {
  return cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function jsonOk<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return Response.json(
    { error: message },
    { status }
  );
}

export function serverError(routeName: string, error: unknown) {
  console.error(`[${routeName}]`, error);

  if (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "23505"
  ) {
    return jsonError("A record with this name already exists.", 409);
  }

  return Response.json(
    { error: "Internal server error." },
    { status: 500 }
  );
}

export function cleanNumber(value: string): number | null {
  const cleaned = value.trim();

  if (!cleaned) return null;

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
}

export function cleanNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  const cleaned = String(value).trim();

  if (!cleaned) return null;

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
}