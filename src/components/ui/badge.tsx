import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "blue";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors",
        {
          "border-transparent bg-[#111214] text-white": variant === "default",
          "border-transparent bg-[#0066FF] text-white": variant === "blue",
          "border-transparent bg-[#F3F4F6] text-zinc-700": variant === "secondary",
          "border-rose-200 bg-rose-50 text-rose-700": variant === "destructive",
          "border-emerald-200 bg-emerald-50 text-emerald-700": variant === "success",
          "border-amber-200 bg-amber-50 text-amber-700": variant === "warning",
          "border-sky-200 bg-sky-50 text-sky-700": variant === "info",
          "border-zinc-200 bg-white text-zinc-600": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
