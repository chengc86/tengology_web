import { fromMinorUnits } from "./money";

/**
 * Map a Square Payment object into the shape checkout and webhooks share.
 * Kept free of the SDK client so the success/failure rules can be tested
 * without credentials.
 */

export interface SquarePaymentSnapshot {
  id?: string;
  status?: string;
  receiptUrl?: string;
  cardBrand?: string;
  last4?: string;
  walletType?: string;
  amount?: number;
}

export interface SquarePaymentResult {
  ok: boolean;
  paymentId?: string;
  status?: string;
  receiptUrl?: string;
  cardBrand?: string;
  last4?: string;
  walletType?: string;
  amount?: number;
  errorCode?: string;
  errorMessage?: string;
  raw?: unknown;
}

/** Money has moved — treat as a successful charge. */
export function isCapturedStatus(status?: string | null): boolean {
  return status === "COMPLETED";
}

/**
 * Square authorised the card but has not captured yet (autocomplete off,
 * or a brief APPROVED window). Do not release stock or fail the order.
 */
export function isAuthorizedStatus(status?: string | null): boolean {
  return status === "APPROVED";
}

export function isFailedStatus(status?: string | null): boolean {
  return status === "FAILED" || status === "CANCELED" || status === "CANCELLED";
}

type PaymentLike = {
  id?: string | null;
  status?: string | null;
  receiptUrl?: string | null;
  cardDetails?: { card?: { cardBrand?: string | null; last4?: string | null } | null } | null;
  walletDetails?: { brand?: string | null } | null;
  amountMoney?: { amount?: bigint | number | null } | null;
};

export function snapshotFromPayment(payment: PaymentLike, fallbackAmount: number): SquarePaymentSnapshot {
  return {
    id: payment.id ?? undefined,
    status: payment.status ?? undefined,
    receiptUrl: payment.receiptUrl ?? undefined,
    cardBrand: payment.cardDetails?.card?.cardBrand ?? undefined,
    last4: payment.cardDetails?.card?.last4 ?? undefined,
    walletType: payment.walletDetails?.brand ?? undefined,
    amount:
      payment.amountMoney?.amount != null
        ? fromMinorUnits(payment.amountMoney.amount)
        : fallbackAmount,
  };
}

export function interpretSquarePayment(
  payment: PaymentLike | null | undefined,
  fallbackAmount: number
): SquarePaymentResult {
  if (!payment) {
    return { ok: false, errorCode: "NO_PAYMENT", errorMessage: "Square did not return a payment." };
  }

  const snapshot = snapshotFromPayment(payment, fallbackAmount);
  const captured = isCapturedStatus(snapshot.status);
  const authorized = isAuthorizedStatus(snapshot.status);

  return {
    ok: captured || authorized,
    paymentId: snapshot.id,
    status: snapshot.status,
    receiptUrl: snapshot.receiptUrl,
    cardBrand: snapshot.cardBrand,
    last4: snapshot.last4,
    walletType: snapshot.walletType,
    amount: snapshot.amount,
    errorCode: captured || authorized ? undefined : snapshot.status,
    errorMessage:
      captured || authorized
        ? undefined
        : `Payment is ${snapshot.status ?? "in an unexpected state"}.`,
    raw: payment,
  };
}

export interface PaymentReconcileInput {
  localPaymentStatus: string;
  localOrderStatus: string;
  localOrderPaymentStatus: string;
  incomingStatus: string;
}

export interface PaymentReconcileResult {
  skip: boolean;
  paymentStatus: string;
  markOrderPaid: boolean;
  markOrderFailed: boolean;
  /** Headline order.status after a successful capture. */
  nextOrderStatus?: string;
}

/**
 * Decide how a payment.updated / payment.created event should move local
 * state. A payment already stored as COMPLETED still has to flip the order
 * if checkout crashed between the two writes.
 */
export function reconcilePaymentUpdate(input: PaymentReconcileInput): PaymentReconcileResult {
  const incoming = input.incomingStatus;
  const markOrderPaid =
    isCapturedStatus(incoming) && input.localOrderPaymentStatus !== "PAID";
  const markOrderFailed =
    isFailedStatus(incoming) &&
    input.localOrderPaymentStatus !== "FAILED" &&
    input.localOrderPaymentStatus !== "PAID" &&
    input.localOrderPaymentStatus !== "PARTIALLY_REFUNDED" &&
    input.localOrderPaymentStatus !== "REFUNDED";

  const paymentChanged = incoming !== input.localPaymentStatus;

  if (!paymentChanged && !markOrderPaid && !markOrderFailed) {
    return { skip: true, paymentStatus: incoming, markOrderPaid: false, markOrderFailed: false };
  }

  let nextOrderStatus: string | undefined;
  if (markOrderPaid) {
    nextOrderStatus =
      input.localOrderStatus === "PENDING" || input.localOrderStatus === "FAILED"
        ? "PAID"
        : input.localOrderStatus;
  }

  return {
    skip: false,
    paymentStatus: incoming,
    markOrderPaid,
    markOrderFailed,
    nextOrderStatus,
  };
}
