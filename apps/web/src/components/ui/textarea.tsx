import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-plum-100 bg-white/90 px-3.5 py-2 text-sm shadow-sm transition-colors placeholder:text-plum-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50 dark:placeholder:text-cream-100/40",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
