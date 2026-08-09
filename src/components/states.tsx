import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-panel flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="surface-panel border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-destructive">Something went wrong</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {message || "Please refresh the page and try again."}
      </p>
    </div>
  );
}
