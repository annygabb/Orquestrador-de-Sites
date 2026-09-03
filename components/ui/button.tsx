import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "motion-border inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl px-4 text-sm font-bold transition-[transform,background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-stage-bright)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-stage-accent)] text-[var(--color-stage-white)] hover:bg-[var(--color-stage-electric)]",
        outline: "border border-[var(--color-stage-rule)] bg-[var(--color-stage-glass)] text-[var(--color-stage-white)] backdrop-blur-xl hover:bg-[var(--color-stage-glass-soft)]",
        ghost: "bg-transparent text-[var(--color-stage-ice)] hover:bg-[var(--color-stage-glass-soft)]",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-14 rounded-2xl px-7 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
