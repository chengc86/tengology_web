import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function OrderStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        ORDER_STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
