import { cn } from "@/lib/utils";
import placeholder from "@/assets/material-placeholder.jpg";

export function MaterialImage({
  url,
  alt,
  className,
  imgClassName,
}: {
  url?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-muted", className)}>
      <img
        src={url || placeholder}
        alt={alt}
        loading="lazy"
        width={800}
        height={600}
        onError={(e) => {
          const el = e.currentTarget;
          if (el.src !== placeholder) el.src = placeholder;
        }}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
    </div>
  );
}
