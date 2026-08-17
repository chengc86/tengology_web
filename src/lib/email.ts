import "server-only";
import { Resend } from "resend";
import { prisma } from "./db";
import { formatMoney } from "./money";
import { formatAddress, parseAddress, type StoredAddress } from "./orders";
import { getSettings } from "./settings";
import { trackingUrlFor } from "./constants";

/**
 * Transactional email.
 *
 * Sending is best-effort and never blocks a commercial action: if Resend is
 * unconfigured or errors, the failure is written to EmailLog and the order
 * still completes. Every send is logged so the admin can see what a customer
 * has (and hasn't) received.
 */

type OrderForEmail = {
  id: string;
  orderNumber: string;
  email: string;
  total: number;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  currency: string;
  discountCode: string | null;
  shippingMethodName: string | null;
  shippingAddress: string | null;
  guestToken: string | null;
  userId: string | null;
  trackingNumber?: string | null;
  shippingCarrier?: string | null;
  items: Array<{
    productTitleSnapshot: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
};

let resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

/** Logged-in customers get the account route; guests get their token link. */
export function orderUrl(order: Pick<OrderForEmail, "orderNumber" | "guestToken" | "userId">): string {
  if (order.userId) return `${siteUrl()}/account/orders/${order.orderNumber}`;
  return `${siteUrl()}/orders/${order.orderNumber}?token=${order.guestToken ?? ""}`;
}

export interface SendResult {
  ok: boolean;
  skipped?: boolean;
  id?: string;
  error?: unknown;
}

async function send({
  to,
  subject,
  html,
  template,
  orderId,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  template: string;
  orderId?: string;
  replyTo?: string;
}): Promise<SendResult> {
  const client = getResend();
  const settings = await getSettings();
  const from = process.env.EMAIL_FROM ?? `${settings.storeName} <${settings.storeEmail}>`;

  if (!client) {
    await prisma.emailLog
      .create({
        data: { to, subject, template, orderId, status: "SKIPPED", error: "RESEND_API_KEY not configured" },
      })
      .catch(() => {});
    return { ok: false, skipped: true };
  }

  try {
    const result = await client.emails.send({
      from,
      to,
      subject,
      html,
      replyTo: replyTo ?? settings.supportEmail,
    });

    if (result.error) throw new Error(result.error.message);

    await prisma.emailLog
      .create({
        data: { to, subject, template, orderId, status: "SENT", providerId: result.data?.id },
      })
      .catch(() => {});

    return { ok: true, id: result.data?.id };
  } catch (error) {
    await prisma.emailLog
      .create({
        data: {
          to,
          subject,
          template,
          orderId,
          status: "FAILED",
          error: error instanceof Error ? error.message : String(error),
        },
      })
      .catch(() => {});
    return { ok: false, error };
  }
}

// ─── Templates ──────────────────────────────────────

const BRAND = {
  ink: "#1c1917",
  muted: "#78716c",
  line: "#e7e5e4",
  accent: "#9f1239",
  bg: "#faf9f7",
};

function layout(heading: string, body: string, storeName: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND.ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BRAND.line};border-radius:4px;">
        <tr><td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid ${BRAND.line};">
          <div style="font-size:20px;letter-spacing:.28em;text-transform:uppercase;font-weight:300;">${storeName}</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 20px;font-size:22px;font-weight:400;line-height:1.3;">${heading}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid ${BRAND.line};text-align:center;color:${BRAND.muted};font-size:12px;line-height:1.6;">
          Handmade with care in Oxford.<br>
          <a href="${siteUrl()}" style="color:${BRAND.muted};">${siteUrl().replace(/^https?:\/\//, "")}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="background:${BRAND.ink};border-radius:2px;">
    <a href="${href}" style="display:inline-block;padding:13px 26px;color:#fff;text-decoration:none;font-size:12px;letter-spacing:.16em;text-transform:uppercase;">${label}</a>
  </td></tr></table>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.ink};">${text}</p>`;
}

function itemsTable(order: OrderForEmail): string {
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.line};font-size:14px;">
          ${escapeHtml(item.productTitleSnapshot)}
          <span style="color:${BRAND.muted};"> × ${item.quantity}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.line};text-align:right;font-size:14px;white-space:nowrap;">
          ${formatMoney(item.totalPrice, order.currency)}
        </td>
      </tr>`
    )
    .join("");

  const totalRow = (label: string, value: string, bold = false) =>
    `<tr>
      <td style="padding:6px 0;font-size:14px;${bold ? "font-weight:600;padding-top:12px;" : `color:${BRAND.muted};`}">${label}</td>
      <td style="padding:6px 0;text-align:right;font-size:14px;${bold ? "font-weight:600;padding-top:12px;" : ""}">${value}</td>
    </tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    ${rows}
    ${totalRow("Subtotal", formatMoney(order.subtotal, order.currency))}
    ${order.discountAmount > 0 ? totalRow(`Discount${order.discountCode ? ` (${escapeHtml(order.discountCode)})` : ""}`, `−${formatMoney(order.discountAmount, order.currency)}`) : ""}
    ${totalRow(
      `Shipping${order.shippingMethodName ? ` — ${escapeHtml(order.shippingMethodName)}` : ""}`,
      order.shippingCost === 0 ? "Free" : formatMoney(order.shippingCost, order.currency)
    )}
    ${order.taxAmount > 0 ? totalRow("VAT", formatMoney(order.taxAmount, order.currency)) : ""}
    ${totalRow("Total", formatMoney(order.total, order.currency), true)}
  </table>`;
}

function addressBlock(address: StoredAddress | null): string {
  const lines = formatAddress(address);
  if (!lines.length) return "";
  return `<div style="margin:20px 0;padding:16px;background:${BRAND.bg};border-radius:3px;font-size:14px;line-height:1.6;color:${BRAND.muted};">
    <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${BRAND.ink};margin-bottom:8px;">Delivering to</div>
    ${lines.map(escapeHtml).join("<br>")}
  </div>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Public senders ─────────────────────────────────

export async function sendOrderConfirmation(order: OrderForEmail) {
  const settings = await getSettings();
  const address = parseAddress(order.shippingAddress);

  const html = layout(
    "Thank you for your order",
    [
      p(`Your order <strong>${escapeHtml(order.orderNumber)}</strong> is confirmed and we've started preparing it.`),
      p("Everything is made by hand, so please allow a few days before it ships. We'll email you as soon as it's on its way."),
      itemsTable(order),
      addressBlock(address),
      button(orderUrl(order), "View your order"),
      p(`<span style="color:${BRAND.muted};font-size:13px;">Questions? Just reply to this email.</span>`),
    ].join(""),
    settings.storeName
  );

  return send({
    to: order.email,
    subject: `Order confirmed — ${order.orderNumber}`,
    html,
    template: "order-confirmation",
    orderId: order.id,
  });
}

export async function sendOrderShipped(order: OrderForEmail) {
  const settings = await getSettings();
  const tracking = trackingUrlFor(order.shippingCarrier ?? null, order.trackingNumber ?? null);

  const html = layout(
    "Your order is on its way",
    [
      p(`Order <strong>${escapeHtml(order.orderNumber)}</strong> has been dispatched.`),
      order.trackingNumber
        ? p(
            `Tracking number: <strong>${escapeHtml(order.trackingNumber)}</strong>${
              order.shippingCarrier ? ` (${escapeHtml(order.shippingCarrier.replace(/_/g, " ").toLowerCase())})` : ""
            }`
          )
        : "",
      itemsTable(order),
      addressBlock(parseAddress(order.shippingAddress)),
      button(tracking ?? orderUrl(order), tracking ? "Track your parcel" : "View your order"),
    ].join(""),
    settings.storeName
  );

  return send({
    to: order.email,
    subject: `Your order has shipped — ${order.orderNumber}`,
    html,
    template: "order-shipped",
    orderId: order.id,
  });
}

export async function sendOrderCancelled(order: OrderForEmail, reason?: string | null) {
  const settings = await getSettings();

  const html = layout(
    "Your order has been cancelled",
    [
      p(`Order <strong>${escapeHtml(order.orderNumber)}</strong> has been cancelled.`),
      reason ? p(`Reason: ${escapeHtml(reason)}`) : "",
      p("If you paid for this order, the refund will appear on your original payment method within 5–10 working days."),
      itemsTable(order),
      button(`${siteUrl()}/shop`, "Continue shopping"),
    ].join(""),
    settings.storeName
  );

  return send({
    to: order.email,
    subject: `Order cancelled — ${order.orderNumber}`,
    html,
    template: "order-cancelled",
    orderId: order.id,
  });
}

export async function sendRefundIssued(order: OrderForEmail, amount: number, reason?: string | null) {
  const settings = await getSettings();
  const isPartial = amount < order.total;

  const html = layout(
    isPartial ? "A partial refund is on its way" : "Your refund is on its way",
    [
      p(`We've refunded <strong>${formatMoney(amount, order.currency)}</strong> for order <strong>${escapeHtml(order.orderNumber)}</strong>.`),
      reason ? p(`Reason: ${escapeHtml(reason)}`) : "",
      p("Refunds usually land on your original payment method within 5–10 working days, depending on your bank."),
      button(orderUrl(order), "View your order"),
    ].join(""),
    settings.storeName
  );

  return send({
    to: order.email,
    subject: `Refund issued — ${order.orderNumber}`,
    html,
    template: "refund-issued",
    orderId: order.id,
  });
}

export async function sendPaymentFailed(order: OrderForEmail, message: string) {
  const settings = await getSettings();

  const html = layout(
    "We couldn't take your payment",
    [
      p(`Your payment for order <strong>${escapeHtml(order.orderNumber)}</strong> didn't go through.`),
      p(escapeHtml(message)),
      p("Nothing has been charged and the items have been returned to stock. You're welcome to try again."),
      button(`${siteUrl()}/checkout`, "Try again"),
    ].join(""),
    settings.storeName
  );

  return send({
    to: order.email,
    subject: `Payment failed — ${order.orderNumber}`,
    html,
    template: "payment-failed",
    orderId: order.id,
  });
}

/** Heads-up to the shop owner so they can start making the piece. */
export async function sendAdminNewOrder(order: OrderForEmail) {
  const settings = await getSettings();
  const to = process.env.ADMIN_EMAIL ?? settings.storeEmail;

  const html = layout(
    `New order — ${escapeHtml(order.orderNumber)}`,
    [
      p(`<strong>${formatMoney(order.total, order.currency)}</strong> from ${escapeHtml(order.email)}`),
      itemsTable(order),
      addressBlock(parseAddress(order.shippingAddress)),
      button(`${siteUrl()}/admin/orders/${order.id}`, "Open in admin"),
    ].join(""),
    settings.storeName
  );

  return send({
    to,
    subject: `New order ${order.orderNumber} — ${formatMoney(order.total, order.currency)}`,
    html,
    template: "admin-new-order",
    orderId: order.id,
  });
}

export async function sendLowStockAlert(products: Array<{ title: string; stockCount: number }>) {
  if (!products.length) return { ok: false, skipped: true };
  const settings = await getSettings();
  const to = process.env.ADMIN_EMAIL ?? settings.storeEmail;

  const html = layout(
    "Low stock alert",
    [
      p("These pieces are running low:"),
      `<ul style="font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 16px;">${products
        .map((p2) => `<li>${escapeHtml(p2.title)} — <strong>${p2.stockCount} left</strong></li>`)
        .join("")}</ul>`,
      button(`${siteUrl()}/admin/inventory`, "Manage inventory"),
    ].join(""),
    settings.storeName
  );

  return send({ to, subject: `Low stock — ${products.length} item(s) need attention`, html, template: "low-stock" });
}
