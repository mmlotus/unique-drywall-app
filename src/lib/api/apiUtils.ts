export function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

  return Response.json(
    { error: "Internal server error." },
    { status: 500 }
  );
}