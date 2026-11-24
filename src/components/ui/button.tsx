import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "primary" | "success";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-semibold ring-offset-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
          {
            "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 shadow-sm": variant === "default",
            "bg-rose-600 text-white hover:bg-rose-500 shadow-sm shadow-rose-950/50": variant === "destructive" || variant === "primary",
            "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-950/50": variant === "success",
            "border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200": variant === "outline",
            "bg-zinc-800 text-zinc-200 hover:bg-zinc-700": variant === "secondary",
            "hover:bg-zinc-800/80 hover:text-zinc-100 text-zinc-400": variant === "ghost",
            "text-rose-400 underline-offset-4 hover:underline": variant === "link",
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-[11px]": size === "sm",
            "h-10 rounded-lg px-6 text-sm": size === "lg",
            "h-9 w-9 p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
