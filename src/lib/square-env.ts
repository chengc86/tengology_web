/**
 * Square environment wiring.
 *
 * `.env.example` ships keys as empty strings. `??` does not treat "" as
 * missing, so a filled `SQUARE_LOCATION_ID` was ignored whenever
 * `NEXT_PUBLIC_SQUARE_LOCATION_ID=""` — the card iframe then initialised
 * with a blank location and never produced a token.
 *
 * Checkout is only enabled when the server can charge *and* the browser
 * can tokenise. Missing any of those vars keeps the unpaid fallback.
 */

export function readEnv(name: string): string {
  const value = process.env[name];
  if (typeof value !== "string") return "";
  return value.trim();
}

/** Server can call the Payments API (charges and refunds). */
export function hasSquareServerCredentials(): boolean {
  return Boolean(readEnv("SQUARE_ACCESS_TOKEN") && readEnv("SQUARE_LOCATION_ID"));
}

/**
 * Location used for both the Web Payments SDK and CreatePayment.
 * Prefer the server id so the token and the charge always target the same
 * Square location; the public var is a fallback.
 */
export function getSquareLocationIdFromEnv(): string {
  const server = readEnv("SQUARE_LOCATION_ID");
  const published = readEnv("NEXT_PUBLIC_SQUARE_LOCATION_ID");
  if (server && published && server !== published) {
    console.warn(
      "[square] SQUARE_LOCATION_ID and NEXT_PUBLIC_SQUARE_LOCATION_ID differ; using SQUARE_LOCATION_ID so the charge matches the card token."
    );
  }
  return server || published;
}

export function getSquareApplicationId(): string {
  return readEnv("NEXT_PUBLIC_SQUARE_APPLICATION_ID");
}

export function getSquareEnvironmentName(): "production" | "sandbox" {
  return readEnv("SQUARE_ENVIRONMENT") === "production" ? "production" : "sandbox";
}

/**
 * True when a shopper can pay by card: server credentials plus the
 * application id the Web Payments SDK needs to mint a sourceId.
 */
export function isSquareCheckoutEnabled(): boolean {
  return (
    hasSquareServerCredentials() &&
    Boolean(getSquareApplicationId() && getSquareLocationIdFromEnv())
  );
}

/** Client-side config for the Web Payments SDK. Safe to expose. */
export function getSquarePublicConfig() {
  return {
    applicationId: getSquareApplicationId(),
    locationId: getSquareLocationIdFromEnv(),
    environment: getSquareEnvironmentName(),
    enabled: isSquareCheckoutEnabled(),
  };
}
