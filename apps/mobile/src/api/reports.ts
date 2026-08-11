import { api } from "./client";
import {
  CancellationReportData,
  MissedAppointmentsReportData,
  RevenueReportData,
  StaffCommissionDetail,
  StaffCommissionSummary,
} from "@/types";

export interface ReportRange {
  from?: string;
  to?: string;
}

export async function getRevenueReport(range: ReportRange) {
  const { data } = await api.get<{ success: boolean } & RevenueReportData>("/api/reports/revenue", {
    params: range,
  });
  return data;
}

export async function getCancellationReport(range: ReportRange, page = 1) {
  const { data } = await api.get<{ success: boolean } & CancellationReportData>("/api/reports/cancellations", {
    params: { ...range, page },
  });
  return data;
}

export async function getMissedAppointmentsReport(range: ReportRange, page = 1) {
  const { data } = await api.get<{ success: boolean } & MissedAppointmentsReportData>(
    "/api/reports/missed-appointments",
    { params: { ...range, page } }
  );
  return data;
}

export async function getStaffCommissionSummary(range: ReportRange) {
  const { data } = await api.get<{ success: boolean } & StaffCommissionSummary>("/api/reports/staff-commission", {
    params: range,
  });
  return data;
}

export async function getStaffCommissionDetail(staffId: string, range: ReportRange, page = 1) {
  const { data } = await api.get<{ success: boolean } & StaffCommissionDetail>(
    `/api/reports/staff-commission/${staffId}`,
    { params: { ...range, page } }
  );
  return data;
}
