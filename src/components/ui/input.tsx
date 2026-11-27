import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-[10px] border border-black/[0.1] bg-[#F8F9FA] px-3 py-2 text-[13px] text-[#111214] transition-[background-color,border-color,box-shadow] duration-150 file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:bg-white focus-visible:ring-3 focus-visible:ring-[#0066FF]/12 focus-visible:border-[#0066FF] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
