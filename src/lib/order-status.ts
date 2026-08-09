export const ORDER_STATUSES = [
  "Order Placed",
  "Confirmed",
  "Preparing",
  "Dispatched",
  "Delivered",
] as const;

export const ALL_STATUSES = [...ORDER_STATUSES, "Cancelled"] as const;

export type OrderStatus = (typeof ALL_STATUSES)[number];

export const statusTone = (
  status: string,
): "muted" | "info" | "warning" | "success" | "destructive" => {
  switch (status) {
    case "Order Placed":
      return "muted";
    case "Confirmed":
      return "info";
    case "Preparing":
      return "warning";
    case "Dispatched":
      return "info";
    case "Delivered":
      return "success";
    case "Cancelled":
      return "destructive";
    default:
      return "muted";
  }
};

export const statusClasses = (status: string) => {
  const tone = statusTone(status);
  const map: Record<string, string> = {
    muted: "bg-muted text-muted-foreground border-border",
    info: "bg-info/10 text-info border-info/30",
    warning: "bg-warning/15 text-warning-foreground border-warning/40",
    success: "bg-success/10 text-success border-success/30",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return map[tone];
};
