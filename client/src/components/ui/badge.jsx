import * as React from "react";
import { cn } from "../../lib/utils";

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-primary/10 border-primary/20 text-primary",
    primary: "bg-primary border-transparent text-primary-foreground",
    secondary: "bg-secondary border-secondary text-foreground",
    destructive: "bg-destructive/10 border-destructive/20 text-destructive",
    outline: "text-foreground border-border bg-transparent",
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-500",
    info: "bg-sky-500/10 border-sky-500/20 text-sky-500",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-0",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
