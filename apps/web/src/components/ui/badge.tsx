import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-plum-700 text-white",
      pink: "bg-gradient-to-r from-brand-400 to-brand-600 text-white shadow-sm",
      navy: "bg-plum-600 text-white shadow-sm",
      amber: "bg-gradient-gold text-white shadow-sm",
      success: "bg-emerald-100 text-emerald-700",
      outline: "border border-plum-200 text-plum-600 dark:border-white/20 dark:text-cream-100",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
