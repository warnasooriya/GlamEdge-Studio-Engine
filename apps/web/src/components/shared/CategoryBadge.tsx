import { Badge } from "@/components/ui/badge";
import { CategoryType } from "@/types";

const CATEGORY_CONFIG: Record<CategoryType, { label: string; variant: "pink" | "navy" | "amber" }> = {
  LADIES: { label: "Ladies", variant: "pink" },
  GENTS: { label: "Gents", variant: "navy" },
  KIDS: { label: "Kids", variant: "amber" },
};

export function CategoryBadge({ category }: { category: CategoryType }) {
  const config = CATEGORY_CONFIG[category];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
