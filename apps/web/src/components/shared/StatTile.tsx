import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<string, string> = {
  brand: "bg-gradient-brand text-white",
  emerald: "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white",
  gold: "bg-gradient-gold text-white",
  rose: "bg-gradient-to-br from-rose-400 to-rose-600 text-white",
};

export function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof TONE_CLASSES;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm", TONE_CLASSES[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-plum-400 dark:text-cream-100/50">{label}</p>
          <p className="truncate font-display text-lg font-semibold text-plum-800 dark:text-cream-50">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
