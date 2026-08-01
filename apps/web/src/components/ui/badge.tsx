import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      default: "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
      pink: "bg-brand-pink/15 text-brand-pink",
      navy: "bg-brand-navy/15 text-brand-navy dark:text-slate-200",
      amber: "bg-brand-amber/20 text-brand-gold",
      success: "bg-emerald-100 text-emerald-700",
      outline: "border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
