import * as React from "react";
import { cn } from "@/lib/ui/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-14 w-full rounded-xl border-[3px] border-black bg-white px-5 py-3 text-base font-bold text-black placeholder:text-gray-400 focus:outline-none focus:bg-primary focus:-translate-y-1 comic-shadow transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
