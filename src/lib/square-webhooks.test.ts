import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractPaymentPayload,
  extractRefundPayload,
  extractWebhookType,
} from "./square-webhooks";
import { interpretSquarePayment, reconcilePaymentUpdate } from "./square-payment";

describe("webhook payload parsing", () => {
  it("reads a standard snake_case payment.created body", () => {
    const event = {
      type: "payment.created",
      data: {
        object: {
          payment: {
            id: "pay_123",
            status: "COMPLETED",
            receipt_url: "https://square.example/r",
            reference_id: "TNG-2026-00001",
            amount_money: { amount: 2599, currency: "GBP" },
          },
        },
      },
    };

    assert.equal(extractWebhookType(event), "payment.created");
    assert.deepEqual(extractPaymentPayload(event), {
      id: "pay_123",
      status: "COMPLETED",
      receiptUrl: "https://square.example/r",
      referenceId: "TNG-2026-00001",
      refundedMinor: undefined,
      amountMinor: 2599,
    });
  });

  it("accepts camelCase and a payment sitting on data.object", () => {
    const event = {
      type: "payment.updated",
      data: {
        object: {
          id: "pay_456",
          status: "COMPLETED",
          receiptUrl: "https://square.example/r2",
          referenceId: "TNG-2026-00002",
          amountMoney: { amount: "1000" },
        },
      },
    };

    assert.deepEqual(extractPaymentPayload(event), {
      id: "pay_456",
      status: "COMPLETED",
      receiptUrl: "https://square.example/r2",
      referenceId: "TNG-2026-00002",
      refundedMinor: undefined,
      amountMinor: 1000,
    });
  });

  it("reads refund.created with payment_id", () => {
    const event = {
      type: "refund.created",
      data: {
        object: {
          refund: {
            id: "rfd_1",
            status: "COMPLETED",
            payment_id: "pay_123",
            amount_money: { amount: 500 },
          },
        },
      },
    };

    assert.deepEqual(extractRefundPayload(event), {
      id: "rfd_1",
      status: "COMPLETED",
      paymentId: "pay_123",
      amountMinor: 500,
    });
  });
});

describe("payment result mapping", () => {
  it("treats COMPLETED as a successful charge", () => {
    const result = interpretSquarePayment(
      {
        id: "pay_ok",
        status: "COMPLETED",
        receiptUrl: "https://receipt",
        cardDetails: { card: { cardBrand: "VISA", last4: "1111" } },
        amountMoney: { amount: BigInt(2500) },
      },
      25
    );
    assert.equal(result.ok, true);
    assert.equal(result.paymentId, "pay_ok");
    assert.equal(result.amount, 25);
    assert.equal(result.last4, "1111");
  });

  it("does not fail an APPROVED payment — capture can finish via CompletePayment or webhook", () => {
    const result = interpretSquarePayment({ id: "pay_auth", status: "APPROVED" }, 10);
    assert.equal(result.ok, true);
    assert.equal(result.status, "APPROVED");
  });

  it("fails FAILED / missing payments", () => {
    assert.equal(interpretSquarePayment({ id: "x", status: "FAILED" }, 1).ok, false);
    assert.equal(interpretSquarePayment(null, 1).ok, false);
  });
});

describe("webhook order reconciliation", () => {
  it("marks the order paid when Square confirms COMPLETED after checkout wrote the payment", () => {
    const plan = reconcilePaymentUpdate({
      localPaymentStatus: "PENDING",
      localOrderStatus: "PENDING",
      localOrderPaymentStatus: "UNPAID",
      incomingStatus: "COMPLETED",
    });
    assert.equal(plan.skip, false);
    assert.equal(plan.markOrderPaid, true);
    assert.equal(plan.nextOrderStatus, "PAID");
  });

  it("still flips a FAILED order to PAID if the capture lands later", () => {
    const plan = reconcilePaymentUpdate({
      localPaymentStatus: "COMPLETED",
      localOrderStatus: "FAILED",
      localOrderPaymentStatus: "FAILED",
      incomingStatus: "COMPLETED",
    });
    assert.equal(plan.skip, false);
    assert.equal(plan.markOrderPaid, true);
    assert.equal(plan.nextOrderStatus, "PAID");
  });

  it("does not fail an already-paid order when a later CANCELED event arrives", () => {
    const plan = reconcilePaymentUpdate({
      localPaymentStatus: "COMPLETED",
      localOrderStatus: "PAID",
      localOrderPaymentStatus: "PAID",
      incomingStatus: "CANCELED",
    });
    assert.equal(plan.markOrderFailed, false);
    assert.equal(plan.markOrderPaid, false);
  });
});
