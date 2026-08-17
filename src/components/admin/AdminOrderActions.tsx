"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Ban, Check, Loader2, Mail, RotateCcw, Send, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/money";
import { ALLOWED_TRANSITIONS, CARRIERS, ORDER_STATUS_LABELS } from "@/lib/constants";
import {
  updateOrderStatus,
  markOrderShipped,
  cancelOrder,
  refundOrder,
  addOrderNote,
  updateAdminNotes,
  resendOrderEmail,
} from "@/actions/admin-orders";

interface Props {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    refundedAmount: number;
    currency: string;
    adminNotes: string | null;
    shippingCarrier: string | null;
    trackingNumber: string | null;
    email: string;
  };
}

type Panel = "ship" | "refund" | "cancel" | null;

export function AdminOrderActions({ order }: Props) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const refundable = Math.max(0, order.total - order.refundedAmount);
  const transitions = ALLOWED_TRANSITIONS[order.status] ?? [];

  function run(action: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    setFeedback(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setFeedback({ tone: "ok", text: result.message ?? "Done." });
        setPanel(null);
        router.refresh();
      } else {
        setFeedback({ tone: "error", text: result.error ?? "That didn't work." });
      }
    });
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          className={`flex items-start gap-2 rounded-sm border p-3 text-sm ${
            feedback.tone === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          }`}
        >
          {feedback.tone === "ok" ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Status transitions */}
      {transitions.length > 0 && (
        <div className="rounded-md border p-4">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Move order forward
          </h3>
          <div className="flex flex-wrap gap-2">
            {transitions
              .filter((next) => next !== "CANCELLED")
              .map((next) => (
                <Button
                  key={next}
                  size="sm"
                  variant={next === "SHIPPED" ? "default" : "outline"}
                  disabled={pending}
                  onClick={() =>
                    next === "SHIPPED"
                      ? setPanel("ship")
                      : run(() => updateOrderStatus({ orderId: order.id, status: next }))
                  }
                >
                  {next === "SHIPPED" && <Truck className="h-3.5 w-3.5" />}
                  Mark {(ORDER_STATUS_LABELS[next] ?? next).toLowerCase()}
                </Button>
              ))}
          </div>
        </div>
      )}

      {/* Ship */}
      {panel === "ship" && (
        <ShipPanel
          order={order}
          pending={pending}
          onCancel={() => setPanel(null)}
          onSubmit={(values) => run(() => markOrderShipped({ orderId: order.id, ...values }))}
        />
      )}

      {/* Refund */}
      {panel === "refund" && (
        <RefundPanel
          refundable={refundable}
          currency={order.currency}
          pending={pending}
          onCancel={() => setPanel(null)}
          onSubmit={(values) => run(() => refundOrder({ orderId: order.id, ...values }))}
        />
      )}

      {/* Cancel */}
      {panel === "cancel" && (
        <CancelPanel
          isPaid={order.paymentStatus === "PAID"}
          pending={pending}
          onCancel={() => setPanel(null)}
          onSubmit={(values) => run(() => cancelOrder({ orderId: order.id, ...values }))}
        />
      )}

      {/* Secondary actions */}
      <div className="rounded-md border p-4">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Other actions
        </h3>
        <div className="flex flex-wrap gap-2">
          {refundable > 0 && order.paymentStatus !== "UNPAID" && (
            <Button size="sm" variant="outline" disabled={pending} onClick={() => setPanel("refund")}>
              <RotateCcw className="h-3.5 w-3.5" />
              Refund ({formatMoney(refundable, order.currency)})
            </Button>
          )}

          {!["CANCELLED", "REFUNDED", "DELIVERED"].includes(order.status) && (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => setPanel("cancel")}
              className="text-destructive hover:text-destructive"
            >
              <Ban className="h-3.5 w-3.5" />
              Cancel order
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run(() => resendOrderEmail({ orderId: order.id, type: "confirmation" }))}
          >
            <Mail className="h-3.5 w-3.5" />
            Resend confirmation
          </Button>

          {order.shippingCarrier && (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => run(() => resendOrderEmail({ orderId: order.id, type: "shipped" }))}
            >
              <Send className="h-3.5 w-3.5" />
              Resend dispatch email
            </Button>
          )}

          <Button asChild size="sm" variant="outline">
            <a href={`/admin/orders/${order.id}/packing-slip`} target="_blank" rel="noreferrer">
              Packing slip
            </a>
          </Button>
        </div>
      </div>

      <InternalNotes order={order} pending={pending} onRun={run} />
    </div>
  );
}

function ShipPanel({
  order,
  pending,
  onCancel,
  onSubmit,
}: {
  order: Props["order"];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: { carrier: string; trackingNumber: string; notifyCustomer: boolean }) => void;
}) {
  const [carrier, setCarrier] = useState(order.shippingCarrier ?? "ROYAL_MAIL");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  return (
    <div className="rounded-md border border-violet-300 bg-violet-50/50 p-4 dark:border-violet-900 dark:bg-violet-950/20">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Truck className="h-4 w-4" />
        Mark as shipped
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs">Carrier</Label>
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {CARRIERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="mb-1.5 block text-xs">Tracking number</Label>
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Optional"
            className="bg-background"
          />
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={notifyCustomer}
          onChange={(e) => setNotifyCustomer(e.target.checked)}
          className="h-4 w-4 accent-foreground"
        />
        Email the customer their tracking details
      </label>

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() => onSubmit({ carrier, trackingNumber, notifyCustomer })}
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Confirm dispatch
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function RefundPanel({
  refundable,
  currency,
  pending,
  onCancel,
  onSubmit,
}: {
  refundable: number;
  currency: string;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    amount: number;
    reason: string;
    restock: boolean;
    notifyCustomer: boolean;
  }) => void;
}) {
  const [amount, setAmount] = useState(refundable.toFixed(2));
  const [reason, setReason] = useState("");
  const [restock, setRestock] = useState(true);
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  const parsed = Number(amount);
  const invalid = !Number.isFinite(parsed) || parsed <= 0 || parsed > refundable;

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-medium">
        <RotateCcw className="h-4 w-4" />
        Issue a refund
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Up to {formatMoney(refundable, currency)} can be refunded. This sends money back through
        Square immediately.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs">Amount</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            max={refundable}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-background"
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Reason</Label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional"
            className="bg-background"
          />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={restock}
            onChange={(e) => setRestock(e.target.checked)}
            className="h-4 w-4 accent-foreground"
          />
          Return the items to stock
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={notifyCustomer}
            onChange={(e) => setNotifyCustomer(e.target.checked)}
            className="h-4 w-4 accent-foreground"
          />
          Email the customer about the refund
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          disabled={pending || invalid}
          onClick={() => onSubmit({ amount: parsed, reason, restock, notifyCustomer })}
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Refund {Number.isFinite(parsed) ? formatMoney(parsed, currency) : ""}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function CancelPanel({
  isPaid,
  pending,
  onCancel,
  onSubmit,
}: {
  isPaid: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: { reason: string; refund: boolean }) => void;
}) {
  const [reason, setReason] = useState("");
  const [refund, setRefund] = useState(true);

  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-medium">
        <Ban className="h-4 w-4" />
        Cancel this order
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Stock goes back on the shelf and the customer is emailed.
      </p>

      <Input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (shown to the customer)"
        className="mb-3 bg-background"
      />

      {isPaid && (
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={refund}
            onChange={(e) => setRefund(e.target.checked)}
            className="h-4 w-4 accent-foreground"
          />
          Refund the payment in full
        </label>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => onSubmit({ reason, refund })}>
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Cancel order
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={pending}>
          Keep it
        </Button>
      </div>
    </div>
  );
}

function InternalNotes({
  order,
  pending,
  onRun,
}: {
  order: Props["order"];
  pending: boolean;
  onRun: (action: () => Promise<{ ok: boolean; message?: string; error?: string }>) => void;
}) {
  const [notes, setNotes] = useState(order.adminNotes ?? "");
  const [entry, setEntry] = useState("");

  return (
    <div className="rounded-md border p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Internal notes
      </h3>

      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder="Notes about this order — only you can see these."
        className="mb-2"
      />
      <Button
        size="sm"
        variant="outline"
        disabled={pending || notes === (order.adminNotes ?? "")}
        onClick={() => onRun(() => updateAdminNotes({ orderId: order.id, notes }))}
      >
        Save notes
      </Button>

      <div className="mt-4 border-t pt-4">
        <Label className="mb-1.5 block text-xs">Add to timeline</Label>
        <div className="flex gap-2">
          <Input
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="e.g. Customer called about delivery"
            onKeyDown={(e) => {
              if (e.key === "Enter" && entry.trim()) {
                e.preventDefault();
                onRun(() => addOrderNote({ orderId: order.id, note: entry }));
                setEntry("");
              }
            }}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={pending || !entry.trim()}
            onClick={() => {
              onRun(() => addOrderNote({ orderId: order.id, note: entry }));
              setEntry("");
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
