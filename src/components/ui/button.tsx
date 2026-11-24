import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "primary" | "success" | "dark";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
          {
            "bg-[#111214] text-white hover:bg-[#23252A] shadow-sm": variant === "default" || variant === "dark",
            "bg-[#0066FF] text-white hover:bg-[#0052D4] shadow-sm shadow-blue-600/20": variant === "primary",
            "bg-rose-600 text-white hover:bg-rose-500 shadow-sm": variant === "destructive",
            "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm": variant === "success",
            "border border-zinc-200 bg-white hover:bg-zinc-50 text-[#111214]": variant === "outline",
            "bg-[#F3F4F6] text-[#111214] hover:bg-zinc-200/80": variant === "secondary",
            "hover:bg-zinc-100 hover:text-[#111214] text-zinc-500": variant === "ghost",
            "text-[#0066FF] underline-offset-4 hover:underline": variant === "link",
            "h-9 px-4 py-2": size === "default",
            "h-8 px-3.5 text-[11px]": size === "sm",
            "h-11 px-6 text-sm": size === "lg",
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
