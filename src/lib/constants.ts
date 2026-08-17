/**
 * Order lifecycle vocabulary.
 *
 * `status` is the headline state a customer sees. `paymentStatus` and
 * `fulfillmentStatus` track the two workflows that move independently —
 * an order can be PAID but UNFULFILLED, or FULFILLED but REFUNDED.
 */

export const ORDER_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  FULFILLING: "FULFILLING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const PAYMENT_STATUS = {
  UNPAID: "UNPAID",
  AUTHORIZED: "AUTHORIZED",
  PAID: "PAID",
  PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const FULFILLMENT_STATUS = {
  UNFULFILLED: "UNFULFILLED",
  PARTIALLY_FULFILLED: "PARTIALLY_FULFILLED",
  FULFILLED: "FULFILLED",
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Awaiting payment",
  PAID: "Paid",
  FULFILLING: "Being prepared",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  FAILED: "Payment failed",
};

/** Tailwind classes for status pills. Kept together so badges never drift apart. */
export const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  PAID: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  FULFILLING: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  SHIPPED: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  DELIVERED: "bg-emerald-200 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-100",
  CANCELLED: "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
  REFUNDED: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
  FAILED: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

/**
 * Which statuses an admin may move an order to from its current one.
 * Terminal states (DELIVERED, CANCELLED, REFUNDED) allow no further transitions;
 * refunding is a separate action because it moves money, not just state.
 */
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "CANCELLED", "FAILED"],
  FAILED: ["PENDING", "CANCELLED"],
  PAID: ["FULFILLING", "SHIPPED", "CANCELLED"],
  FULFILLING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

/** A customer may cancel their own order only while nothing has shipped. */
export const CUSTOMER_CANCELLABLE: string[] = ["PENDING", "PAID", "FULFILLING"];

export const ORDER_EVENT = {
  CREATED: "CREATED",
  PAYMENT_SUCCEEDED: "PAYMENT_SUCCEEDED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  STATUS_CHANGED: "STATUS_CHANGED",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
  NOTE: "NOTE",
  EMAIL_SENT: "EMAIL_SENT",
} as const;

export const CARRIERS = [
  { id: "ROYAL_MAIL", name: "Royal Mail", trackingUrl: "https://www.royalmail.com/track-your-item#/tracking-results/{n}" },
  { id: "EVRI", name: "Evri", trackingUrl: "https://www.evri.com/track/parcel/{n}" },
  { id: "DPD", name: "DPD", trackingUrl: "https://track.dpd.co.uk/search?reference={n}" },
  { id: "YODEL", name: "Yodel", trackingUrl: "https://www.yodel.co.uk/track/{n}" },
  { id: "PARCELFORCE", name: "Parcelforce", trackingUrl: "https://www.parcelforce.com/track-trace?trackNumber={n}" },
  { id: "OTHER", name: "Other", trackingUrl: "" },
];

export function trackingUrlFor(carrier: string | null, trackingNumber: string | null): string | null {
  if (!carrier || !trackingNumber) return null;
  const match = CARRIERS.find((c) => c.id === carrier);
  if (!match?.trackingUrl) return null;
  return match.trackingUrl.replace("{n}", encodeURIComponent(trackingNumber));
}
