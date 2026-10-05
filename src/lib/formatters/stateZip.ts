export function normalizeState(
  value: string | null | undefined
): string {
  return value
    ?.replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 2) ?? "";
}

export function normalizeZip(
  value: string | null | undefined
): string {
  return value?.replace(/\D/g, "").slice(0, 9) ?? "";
}

export function formatZip(
  value: string | null | undefined
): string {
  const digits = normalizeZip(value);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}