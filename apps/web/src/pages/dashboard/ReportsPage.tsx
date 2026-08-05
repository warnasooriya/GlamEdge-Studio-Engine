import { useState } from "react";
import { TrendingUp, XCircle, AlertTriangle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangeFilter, defaultRange } from "@/components/shared/DateRangeFilter";
import { RevenueReport } from "@/components/reports/RevenueReport";
import { CancellationReport } from "@/components/reports/CancellationReport";
import { MissedAppointmentsReport } from "@/components/reports/MissedAppointmentsReport";
import { StaffCommissionReport } from "@/components/reports/StaffCommissionReport";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "revenue", label: "Revenue", icon: TrendingUp },
  { key: "cancellations", label: "Cancellations", icon: XCircle },
  { key: "missed", label: "Missed Appointments", icon: AlertTriangle },
  { key: "staff-commission", label: "Staff Commission", icon: Wallet },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ReportsPage() {
  const [tab, setTab] = useState<TabKey>("revenue");
  const [{ from, to }, setRange] = useState(defaultRange(30));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold text-plum-800 dark:text-cream-50">Reports</h1>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={tab === t.key ? "default" : "outline"}
            onClick={() => setTab(t.key)}
            className={cn(tab === t.key && "shadow-glow")}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </Button>
        ))}
      </div>

      <DateRangeFilter from={from} to={to} onChange={(f, t) => setRange({ from: f, to: t })} />

      {tab === "revenue" && <RevenueReport from={from} to={to} />}
      {tab === "cancellations" && <CancellationReport from={from} to={to} />}
      {tab === "missed" && <MissedAppointmentsReport from={from} to={to} />}
      {tab === "staff-commission" && <StaffCommissionReport from={from} to={to} />}
    </div>
  );
}
