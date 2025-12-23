import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed  disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground hover:bg-hover",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        switch:
          "bg-background border border-background hover:text-card-foreground hover:bg-hover hover:border-background transition-colors duration-300",
        datepicker:
        "bg-primary  hover:text-card-foreground hover:bg-hover focus:ring-3 focus:ring-primary-foreground focus:border-primary-foreground text-primary-foreground border-2 border-input transition-colors duration-300 focus:outline-hidden",
        add:
          "bg-primary hover:bg-hover hover:text-card-foreground text-primary-foreground border border-input transition-colors duration-200",
        columns:
        "bg-primary hover:bg-hover hover:text-card-foreground text-primary-foreground border border-input transition-colors duration-200",
        
        },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        fill: "h-full w-full px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
