import "server-only";
import { SquareClient, SquareEnvironment, SquareError, WebhooksHelper, type Square } from "square";
import { CURRENCY, toMinorUnits } from "./money";
import {
  getSquareEnvironmentName,
  getSquareLocationIdFromEnv,
  hasSquareServerCredentials,
  readEnv,
} from "./square-env";
import { interpretSquarePayment, isAuthorizedStatus, type SquarePaymentResult } from "./square-payment";

export {
  getSquarePublicConfig,
  hasSquareServerCredentials,
  isSquareCheckoutEnabled,
} from "./square-env";
export type { SquarePaymentResult } from "./square-payment";

/**
 * Square Payments integration.
 *
 * The storefront tokenises the card in the browser with the Web Payments SDK
 * and posts an opaque `sourceId` here; raw card numbers never touch this
 * server. Every write carries an idempotency key derived from our own order
 * so a retried request can never charge twice.
 *
 * When checkout credentials are absent (`isSquareCheckoutEnabled() === false`)
 * the checkout falls back to placing unpaid orders, so the shop is still
 * usable before the Square account is wired up. Server-only credentials
 * (`isSquareConfigured`) are enough for refunds of existing payments.
 */

/**
 * Square types its `country` and `currency` fields as closed string unions.
 * Our own values come from user input and settings, so they are narrowed at
 * the call site rather than threaded through the whole app as branded types.
 */
export interface SquareAddress {
  addressLine1?: string;
  addressLine2?: string;
  locality?: string; // city
  administrativeDistrictLevel1?: string; // county
  postalCode?: string;
  country?: string;
  firstName?: string;
  lastName?: string;
}

function toSquareAddressType(address?: SquareAddress): Square.Address | undefined {
  if (!address) return undefined;
  return { ...address, country: address.country as Square.Country | undefined };
}

function asCurrency(currency: string): Square.Currency {
  return currency as Square.Currency;
}

/** Server can talk to Square. Card checkout also needs the public application id. */
export function isSquareConfigured(): boolean {
  return hasSquareServerCredentials();
}

function squareEnvironment() {
  return getSquareEnvironmentName() === "production"
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;
}

let client: SquareClient | null = null;

export function resetSquareClient() {
  client = null;
}

export function getSquareClient(): SquareClient {
  const token = readEnv("SQUARE_ACCESS_TOKEN");
  if (!token) {
    throw new Error("SQUARE_ACCESS_TOKEN is not set");
  }
  if (!client) {
    client = new SquareClient({
      token,
      environment: squareEnvironment(),
    });
  }
  return client;
}

export function getSquareLocationId(): string {
  const locationId = getSquareLocationIdFromEnv();
  if (!locationId) throw new Error("SQUARE_LOCATION_ID is not set");
  return locationId;
}

/** Turn any Square failure into a message safe to show a shopper. */
export function describeSquareError(error: unknown): { code: string; message: string } {
  if (error instanceof SquareError) {
    const fromSdk = error.errors?.[0];
    const fromBody = (error.body as { errors?: Array<{ code?: string; detail?: string; category?: string }> })
      ?.errors?.[0];
    const detail = fromSdk ?? fromBody;
    const code = detail?.code ?? "SQUARE_ERROR";

    const friendly: Record<string, string> = {
      CARD_DECLINED: "Your card was declined. Please try a different card.",
      CVV_FAILURE: "The security code (CVV) didn't match. Please check and try again.",
      ADDRESS_VERIFICATION_FAILURE: "The billing postcode didn't match your card. Please check and try again.",
      EXPIRATION_FAILURE: "That expiry date isn't valid. Please check your card details.",
      INSUFFICIENT_FUNDS: "Your card has insufficient funds for this purchase.",
      CARD_EXPIRED: "That card has expired. Please use a different card.",
      INVALID_CARD: "Those card details don't look right. Please check and try again.",
      GENERIC_DECLINE: "Your card was declined. Please try a different payment method.",
      PAYMENT_LIMIT_EXCEEDED: "This payment exceeds the limit on your card.",
      INVALID_EXPIRATION: "That expiry date isn't valid. Please check your card details.",
    };

    return {
      code,
      message: friendly[code] ?? detail?.detail ?? "We couldn't process that payment. Please try again.",
    };
  }

  return {
    code: "UNKNOWN",
    message: error instanceof Error ? error.message : "We couldn't process that payment. Please try again.",
  };
}

export interface CreatePaymentInput {
  sourceId: string;
  /** Stable per order+attempt, so a network retry can't double-charge. */
  idempotencyKey: string;
  amount: number;
  currency?: string;
  orderNumber: string;
  buyerEmail?: string;
  note?: string;
  verificationToken?: string;
  billingAddress?: SquareAddress;
  shippingAddress?: SquareAddress;
}

export async function createSquarePayment(input: CreatePaymentInput): Promise<SquarePaymentResult> {
  const square = getSquareClient();

  try {
    const response = await square.payments.create({
      sourceId: input.sourceId,
      idempotencyKey: input.idempotencyKey,
      amountMoney: {
        amount: toMinorUnits(input.amount),
        currency: asCurrency(input.currency ?? CURRENCY),
      },
      locationId: getSquareLocationId(),
      referenceId: input.orderNumber,
      note: input.note ?? `Tengology order ${input.orderNumber}`,
      buyerEmailAddress: input.buyerEmail,
      verificationToken: input.verificationToken,
      billingAddress: toSquareAddressType(input.billingAddress),
      shippingAddress: toSquareAddressType(input.shippingAddress),
      autocomplete: true,
    });

    let payment = response.payment;

    // autocomplete:true normally captures immediately. If Square still
    // returns APPROVED, complete the payment so the order is actually paid
    // rather than failing checkout and releasing stock on an authorised card.
    if (payment?.id && isAuthorizedStatus(payment.status)) {
      try {
        const completed = await square.payments.complete({ paymentId: payment.id });
        if (completed.payment) payment = completed.payment;
      } catch (error) {
        console.warn("[square] CompletePayment after APPROVED failed; webhook may finish capture", error);
      }
    }

    return interpretSquarePayment(payment, input.amount);
  } catch (error) {
    const { code, message } = describeSquareError(error);
    return { ok: false, errorCode: code, errorMessage: message, raw: serialiseError(error) };
  }
}

export interface RefundInput {
  paymentId: string;
  idempotencyKey: string;
  amount: number;
  currency?: string;
  reason?: string;
}

export interface SquareRefundResult {
  ok: boolean;
  refundId?: string;
  status?: string;
  errorCode?: string;
  errorMessage?: string;
  raw?: unknown;
}

export async function refundSquarePayment(input: RefundInput): Promise<SquareRefundResult> {
  const square = getSquareClient();

  try {
    const response = await square.refunds.refundPayment({
      paymentId: input.paymentId,
      idempotencyKey: input.idempotencyKey,
      amountMoney: {
        amount: toMinorUnits(input.amount),
        currency: asCurrency(input.currency ?? CURRENCY),
      },
      reason: input.reason ?? undefined,
    });

    const refund = response.refund;
    if (!refund) {
      return { ok: false, errorCode: "NO_REFUND", errorMessage: "Square did not return a refund." };
    }

    return {
      ok: refund.status === "COMPLETED" || refund.status === "PENDING",
      refundId: refund.id,
      status: refund.status ?? undefined,
      raw: refund,
    };
  } catch (error) {
    const { code, message } = describeSquareError(error);
    return { ok: false, errorCode: code, errorMessage: message, raw: serialiseError(error) };
  }
}

export async function getSquarePayment(paymentId: string) {
  const square = getSquareClient();
  const response = await square.payments.get({ paymentId });
  return response.payment ?? null;
}

/**
 * Verify a webhook came from Square before acting on it. Without the
 * signature key configured we refuse rather than trusting the payload.
 */
export async function verifySquareWebhook(
  body: string,
  signatureHeader: string | null
): Promise<boolean> {
  const signatureKey = readEnv("SQUARE_WEBHOOK_SIGNATURE_KEY");
  const notificationUrl = readEnv("SQUARE_WEBHOOK_URL");

  if (!signatureKey || !notificationUrl || !signatureHeader) return false;

  try {
    return await WebhooksHelper.verifySignature({
      requestBody: body,
      signatureHeader,
      signatureKey,
      notificationUrl,
    });
  } catch {
    return false;
  }
}

/** JSON.stringify chokes on BigInt, which Square uses for every amount. */
export function serialiseError(value: unknown): string {
  try {
    return JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v));
  } catch {
    return String(value);
  }
}

