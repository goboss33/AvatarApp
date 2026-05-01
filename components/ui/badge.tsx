import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-4 py-1.5 text-xs font-black uppercase tracking-wide transition-all duration-300 cursor-default border-[3px] border-black comic-shadow",
  {
    variants: {
      variant: {
        default: "bg-primary text-black",
        secondary: "bg-secondary text-black",
        destructive: "bg-destructive text-black",
        outline: "text-black border-[3px] border-black bg-transparent",
        success: "bg-accent text-black",
        warning: "bg-yellow-300 text-black",
        processing: "bg-blue-300 text-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
