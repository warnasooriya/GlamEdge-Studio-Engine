import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-brand text-white shadow-glow hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5",
        gold: "bg-gradient-gold text-white shadow-glow-gold hover:brightness-110 hover:-translate-y-0.5",
        plum: "bg-plum-600 text-white hover:bg-plum-500",
        outline:
          "border-2 border-brand-300 bg-transparent text-brand-600 hover:bg-brand-50 dark:border-brand-400/60 dark:text-brand-200 dark:hover:bg-white/5",
        ghost: "rounded-md text-plum-600 hover:bg-brand-50 dark:text-cream-100 dark:hover:bg-white/5",
        destructive: "bg-red-600 text-white hover:bg-red-600/90",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
