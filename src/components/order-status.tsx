import { Check, Circle, XCircle } from "lucide-react";
import { ORDER_STATUSES, statusClasses } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        statusClasses(status),
      )}
    >
      {status}
    </span>
  );
}

export function StatusTimeline({ status }: { status: string }) {
  if (status === "Cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        <XCircle className="h-4 w-4" /> This order was cancelled.
      </div>
    );
  }
  const currentIndex = ORDER_STATUSES.indexOf(status as (typeof ORDER_STATUSES)[number]);

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start">
      {ORDER_STATUSES.map((step, index) => {
        const done = index <= currentIndex;
        return (
          <li key={step} className="flex flex-1 gap-3 sm:flex-col sm:gap-2">
            <div className="flex flex-col items-center sm:w-full sm:flex-row">
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full border-2",
                  done
                    ? "border-success bg-success text-success-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <Circle className="h-2.5 w-2.5" />}
              </span>
              {index < ORDER_STATUSES.length - 1 && (
                <span
                  className={cn(
                    "w-0.5 flex-1 sm:h-0.5 sm:w-full",
                    index < currentIndex ? "bg-success" : "bg-border",
                  )}
                />
              )}
            </div>
            <p
              className={cn(
                "pb-6 text-xs font-medium sm:pb-0",
                done ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
