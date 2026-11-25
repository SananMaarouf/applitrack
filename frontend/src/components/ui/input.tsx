import * as React from "react"

import { cn } from "@/lib/utils"

type InputSize = "sm" | "md" | "lg"

type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  /** Visual size. A numeric native `size` is still passed through. */
  size?: InputSize | number
}

function Input({ className, type, size, ...props }: InputProps) {
  const visualSize = typeof size === "number" ? "md" : (size ?? "md")

  return (
    <input
      type={type}
      size={typeof size === "number" ? size : undefined}
      data-slot="input"
      data-size={visualSize}
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-4 py-2 text-base text-foreground shadow-xs transition-[color,background-color,border-color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-[size=sm]:h-8 data-[size=sm]:px-3 data-[size=sm]:text-sm data-[size=lg]:h-12 data-[size=lg]:px-5 data-[size=lg]:text-base",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
