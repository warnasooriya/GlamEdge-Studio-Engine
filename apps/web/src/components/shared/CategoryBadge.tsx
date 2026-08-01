import { Sparkles, Scissors, Baby } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategoryType } from "@/types";

const CATEGORY_CONFIG: Record<
  CategoryType,
  { label: string; variant: "pink" | "navy" | "amber"; icon: typeof Sparkles }
> = {
  LADIES: { label: "Ladies", variant: "pink", icon: Sparkles },
  GENTS: { label: "Gents", variant: "navy", icon: Scissors },
  KIDS: { label: "Kids", variant: "amber", icon: Baby },
};

export function CategoryBadge({ category }: { category: CategoryType }) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
