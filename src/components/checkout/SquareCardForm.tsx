"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { Loader2, Lock } from "lucide-react";

/**
 * Square Web Payments SDK card entry.
 *
 * The card fields live in an iframe hosted by Square, so card numbers never
 * enter our DOM or our server — we only ever receive a single-use token.
 * `tokenize()` also runs `verifyBuyer`, which triggers 3-D Secure when the
 * bank asks for it (required for Strong Customer Authentication in the UK/EU).
 */

export interface SquareTokenResult {
  ok: boolean;
  token?: string;
  verificationToken?: string;
  error?: string;
}

export interface SquareCardFormHandle {
  tokenize: (details: VerificationDetails) => Promise<SquareTokenResult>;
  isReady: () => boolean;
}

export interface VerificationDetails {
  amount: string;
  billingContact: {
    givenName?: string;
    familyName?: string;
    email?: string;
    phone?: string;
    addressLines?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    countryCode?: string;
  };
}

interface TokenResult {
  status: string;
  token?: string;
  errors?: Array<{ message: string }>;
}

interface SquareCard {
  attach: (selector: string | HTMLElement) => Promise<void>;
  tokenize: (verificationDetails?: Record<string, unknown>) => Promise<TokenResult>;
  destroy: () => Promise<void>;
}

interface SquarePayments {
  card: (options?: Record<string, unknown>) => Promise<SquareCard>;
  verifyBuyer: (
    token: string,
    details: Record<string, unknown>
  ) => Promise<{ token?: string } | null>;
}

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => SquarePayments | Promise<SquarePayments>;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadSquareSdk(environment: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Square) return Promise.resolve();

  if (!scriptPromise) {
    const src =
      environment === "production"
        ? "https://web.squarecdn.com/v1/square.js"
        : "https://sandbox.web.squarecdn.com/v1/square.js";

    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Square SDK failed to load")));
        if (window.Square) resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Square SDK failed to load"));
      };
      document.head.appendChild(script);
    });
  }

  return scriptPromise;
}

export function SquareCardForm({
  applicationId,
  locationId,
  environment,
  currency = "GBP",
  ref,
  onReadyChange,
}: {
  applicationId: string;
  locationId: string;
  environment: string;
  currency?: string;
  ref?: React.Ref<SquareCardFormHandle>;
  onReadyChange?: (ready: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<SquareCard | null>(null);
  const paymentsRef = useRef<SquarePayments | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    let attachedCard: SquareCard | null = null;

    async function initialise() {
      try {
        await loadSquareSdk(environment);
        if (cancelled || !window.Square || !containerRef.current) return;

        if (!applicationId || !locationId) {
          throw new Error("Square is missing an application or location id.");
        }

        // Recent square.js builds return a Promise; older ones return the
        // Payments object. await is a no-op on a non-Promise.
        const payments = await window.Square.payments(applicationId, locationId);
        paymentsRef.current = payments;

        const card = await payments.card({
          style: {
            input: { fontSize: "15px" },
            ".input-container": { borderRadius: "4px" },
          },
        });

        if (cancelled) {
          await card.destroy().catch(() => {});
          return;
        }

        await card.attach(containerRef.current);
        attachedCard = card;
        cardRef.current = card;
        setStatus("ready");
        onReadyChange?.(true);
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Card entry couldn't be loaded.");
        onReadyChange?.(false);
      }
    }

    initialise();

    return () => {
      cancelled = true;
      attachedCard?.destroy().catch(() => {});
      cardRef.current = null;
    };
    // Re-initialising on every render would tear down the iframe mid-typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, locationId, environment]);

  useImperativeHandle(
    ref,
    () => ({
      isReady: () => status === "ready" && Boolean(cardRef.current),
      tokenize: async (details: VerificationDetails): Promise<SquareTokenResult> => {
        const card = cardRef.current;
        const payments = paymentsRef.current;

        if (!card || !payments) {
          return { ok: false, error: "Card entry isn't ready yet. Please wait a moment." };
        }

        try {
          const verificationDetails = {
            amount: details.amount,
            currencyCode: currency,
            intent: "CHARGE",
            customerInitiated: true,
            sellerKeepsCard: false,
            billingContact: details.billingContact,
          };

          // Current Web Payments SDK runs 3-D Secure inside tokenize() when
          // these details are passed. Fall back to tokenize() + verifyBuyer
          // if this square.js build still uses the older two-step API.
          let result: TokenResult;
          try {
            result = await card.tokenize(verificationDetails);
          } catch {
            result = await card.tokenize();
          }

          if (result.status !== "OK" || !result.token) {
            return {
              ok: false,
              error: result.errors?.[0]?.message ?? "Please check your card details.",
            };
          }

          let verificationToken: string | undefined;
          try {
            const verification = await payments.verifyBuyer(result.token, verificationDetails);
            verificationToken = verification?.token;
          } catch {
            // Tokenize may already have completed SCA. If the bank still
            // requires a challenge token, Square declines server-side.
          }

          return { ok: true, token: result.token, verificationToken };
        } catch (err) {
          return {
            ok: false,
            error: err instanceof Error ? err.message : "We couldn't read those card details.",
          };
        }
      },
    }),
    [status, currency]
  );

  return (
    <div>
      <div
        ref={containerRef}
        className="min-h-[90px] rounded-sm border bg-background p-3 transition-opacity data-[loading=true]:opacity-50"
        data-loading={status === "loading"}
      />

      {status === "loading" && (
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading secure card entry…
        </p>
      )}

      {status === "error" && (
        <p className="mt-2 text-xs text-destructive">
          {error} Please refresh the page and try again.
        </p>
      )}

      {status === "ready" && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Encrypted and processed by Square. We never see your card number.
        </p>
      )}
    </div>
  );
}
