import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  getSquareLocationIdFromEnv,
  getSquarePublicConfig,
  hasSquareServerCredentials,
  isSquareCheckoutEnabled,
  readEnv,
} from "./square-env";

const KEYS = [
  "SQUARE_ACCESS_TOKEN",
  "SQUARE_LOCATION_ID",
  "SQUARE_ENVIRONMENT",
  "NEXT_PUBLIC_SQUARE_APPLICATION_ID",
  "NEXT_PUBLIC_SQUARE_LOCATION_ID",
] as const;

const previous = new Map<string, string | undefined>();

function setEnv(values: Partial<Record<(typeof KEYS)[number], string | undefined>>) {
  for (const key of KEYS) {
    if (!previous.has(key)) previous.set(key, process.env[key]);
    const value = values[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  for (const [key, value] of previous) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  previous.clear();
});

describe("readEnv", () => {
  it("treats missing, blank, and whitespace as empty", () => {
    setEnv({ SQUARE_ACCESS_TOKEN: undefined });
    assert.equal(readEnv("SQUARE_ACCESS_TOKEN"), "");

    setEnv({ SQUARE_ACCESS_TOKEN: "" });
    assert.equal(readEnv("SQUARE_ACCESS_TOKEN"), "");

    setEnv({ SQUARE_ACCESS_TOKEN: "  sandbox-token  " });
    assert.equal(readEnv("SQUARE_ACCESS_TOKEN"), "sandbox-token");
  });
});

describe("Square checkout enablement", () => {
  it("stays off when credentials are absent so unpaid fallback still works", () => {
    setEnv({
      SQUARE_ACCESS_TOKEN: "",
      SQUARE_LOCATION_ID: "",
      NEXT_PUBLIC_SQUARE_APPLICATION_ID: "",
      NEXT_PUBLIC_SQUARE_LOCATION_ID: "",
    });
    assert.equal(hasSquareServerCredentials(), false);
    assert.equal(isSquareCheckoutEnabled(), false);
    assert.equal(getSquarePublicConfig().enabled, false);
  });

  it("does not enable the card form when only the server token is set", () => {
    setEnv({
      SQUARE_ACCESS_TOKEN: "sandbox-token",
      SQUARE_LOCATION_ID: "LTEST",
      NEXT_PUBLIC_SQUARE_APPLICATION_ID: "",
    });
    assert.equal(hasSquareServerCredentials(), true);
    assert.equal(isSquareCheckoutEnabled(), false);
  });

  it("enables checkout when token, location, and application id are present", () => {
    setEnv({
      SQUARE_ACCESS_TOKEN: "sandbox-token",
      SQUARE_LOCATION_ID: "LTEST",
      NEXT_PUBLIC_SQUARE_APPLICATION_ID: "sandbox-sq0idb-app",
      NEXT_PUBLIC_SQUARE_LOCATION_ID: "",
      SQUARE_ENVIRONMENT: "sandbox",
    });
    assert.equal(isSquareCheckoutEnabled(), true);
    const config = getSquarePublicConfig();
    assert.equal(config.enabled, true);
    assert.equal(config.applicationId, "sandbox-sq0idb-app");
    assert.equal(config.locationId, "LTEST");
    assert.equal(config.environment, "sandbox");
  });

  it("does not let an empty public location id hide the server location", () => {
    setEnv({
      SQUARE_ACCESS_TOKEN: "sandbox-token",
      SQUARE_LOCATION_ID: "LSERVER",
      NEXT_PUBLIC_SQUARE_LOCATION_ID: "",
      NEXT_PUBLIC_SQUARE_APPLICATION_ID: "sandbox-sq0idb-app",
    });
    assert.equal(getSquareLocationIdFromEnv(), "LSERVER");
    assert.equal(getSquarePublicConfig().locationId, "LSERVER");
    assert.equal(getSquarePublicConfig().enabled, true);
  });

  it("prefers the server location when the two ids disagree", () => {
    setEnv({
      SQUARE_LOCATION_ID: "LCHARGE",
      NEXT_PUBLIC_SQUARE_LOCATION_ID: "LFORM",
    });
    assert.equal(getSquareLocationIdFromEnv(), "LCHARGE");
  });
});
