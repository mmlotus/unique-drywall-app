export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const money = (value: number) => value.toLocaleString("en-US", {
  style: "currency", currency: "USD",
});

export const numberText = (value: number) => value.toLocaleString("en-US", {
  maximumFractionDigits: 3,
});