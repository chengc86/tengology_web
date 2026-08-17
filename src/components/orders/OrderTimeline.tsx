import {
  Ban,
  CheckCircle2,
  CreditCard,
  MessageSquare,
  Package,
  RotateCcw,
  Send,
  Truck,
  XCircle,
} from "lucide-react";
import { ORDER_EVENT } from "@/lib/constants";

interface TimelineEvent {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
  isCustomerVisible: boolean;
}

const ICONS: Record<string, typeof Package> = {
  [ORDER_EVENT.CREATED]: Package,
  [ORDER_EVENT.PAYMENT_SUCCEEDED]: CreditCard,
  [ORDER_EVENT.PAYMENT_FAILED]: XCircle,
  [ORDER_EVENT.STATUS_CHANGED]: CheckCircle2,
  [ORDER_EVENT.SHIPPED]: Truck,
  [ORDER_EVENT.DELIVERED]: CheckCircle2,
  [ORDER_EVENT.CANCELLED]: Ban,
  [ORDER_EVENT.REFUNDED]: RotateCcw,
  [ORDER_EVENT.NOTE]: MessageSquare,
  [ORDER_EVENT.EMAIL_SENT]: Send,
};

const TONES: Record<string, string> = {
  [ORDER_EVENT.PAYMENT_FAILED]: "text-destructive",
  [ORDER_EVENT.CANCELLED]: "text-destructive",
  [ORDER_EVENT.REFUNDED]: "text-amber-600",
  [ORDER_EVENT.PAYMENT_SUCCEEDED]: "text-emerald-600",
  [ORDER_EVENT.DELIVERED]: "text-emerald-600",
};

export function OrderTimeline({
  events,
  showInternal = false,
}: {
  events: TimelineEvent[];
  showInternal?: boolean;
}) {
  const visible = showInternal ? events : events.filter((e) => e.isCustomerVisible);

  if (visible.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing to show yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {visible.map((event) => {
        const Icon = ICONS[event.type] ?? CheckCircle2;
        return (
          <li key={event.id} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon className={`h-3.5 w-3.5 ${TONES[event.type] ?? "text-muted-foreground"}`} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">
                {event.message}
                {showInternal && !event.isCustomerVisible && (
                  <span className="ml-2 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    internal
                  </span>
                )}
              </p>
              <time className="text-xs text-muted-foreground" dateTime={event.createdAt.toISOString()}>
                {event.createdAt.toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
