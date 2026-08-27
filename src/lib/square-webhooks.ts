/**
 * Square webhook payload normalisation.
 *
 * Notifications are snake_case JSON. Some SDK samples and older docs use
 * camelCase, so both are accepted. The payment object lives at
 * `data.object.payment`, but a few payloads put the payment on `data.object`.
 */

export interface SquarePaymentPayload {
  id?: string;
  status?: string;
  receiptUrl?: string;
  referenceId?: string;
  refundedMinor?: number;
  amountMinor?: number;
}

export interface SquareRefundPayload {
  id?: string;
  status?: string;
  paymentId?: string;
  amountMinor?: number;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function pickString(...candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return undefined;
}

function pickMinorAmount(money: unknown): number | undefined {
  const record = asRecord(money);
  const amount = record?.amount;
  if (typeof amount === "number" && Number.isFinite(amount)) return amount;
  if (typeof amount === "string" && amount.trim()) {
    const parsed = Number(amount);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function extractWebhookType(event: unknown): string | undefined {
  const record = asRecord(event);
  return pickString(record?.type, record?.event_type);
}

export function extractPaymentPayload(event: unknown): SquarePaymentPayload | undefined {
  const root = asRecord(event);
  const data = asRecord(root?.data);
  const object = asRecord(data?.object);
  const payment = asRecord(object?.payment) ?? (object?.id || object?.status ? object : undefined);
  if (!payment) return undefined;

  const id = pickString(payment.id);
  if (!id) return undefined;

  return {
    id,
    status: pickString(payment.status),
    receiptUrl: pickString(payment.receipt_url, payment.receiptUrl),
    referenceId: pickString(payment.reference_id, payment.referenceId),
    refundedMinor: pickMinorAmount(payment.refunded_money ?? payment.refundedMoney),
    amountMinor: pickMinorAmount(payment.amount_money ?? payment.amountMoney),
  };
}

export function extractRefundPayload(event: unknown): SquareRefundPayload | undefined {
  const root = asRecord(event);
  const data = asRecord(root?.data);
  const object = asRecord(data?.object);
  const refund = asRecord(object?.refund) ?? (object?.payment_id || object?.paymentId ? object : undefined);
  if (!refund) return undefined;

  const id = pickString(refund.id);
  if (!id) return undefined;

  return {
    id,
    status: pickString(refund.status),
    paymentId: pickString(refund.payment_id, refund.paymentId),
    amountMinor: pickMinorAmount(refund.amount_money ?? refund.amountMoney),
  };
}
