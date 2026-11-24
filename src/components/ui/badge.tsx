import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
        {
          "border-transparent bg-zinc-100 text-zinc-900": variant === "default",
          "border-zinc-800 bg-zinc-900 text-zinc-300": variant === "secondary",
          "border-rose-500/20 bg-rose-500/10 text-rose-300": variant === "destructive",
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-300": variant === "success",
          "border-amber-500/20 bg-amber-500/10 text-amber-300": variant === "warning",
          "border-sky-500/20 bg-sky-500/10 text-sky-300": variant === "info",
          "border-zinc-700 text-zinc-400": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
