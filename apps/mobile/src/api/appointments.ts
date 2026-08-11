import { api } from "./client";
import { Appointment, AppointmentMessage, AppointmentStatus, PaginatedResponse } from "@/types";

export interface ListAppointmentsParams {
  from?: string;
  to?: string;
  status?: AppointmentStatus;
  search?: string;
  excludeCancelled?: boolean;
  isBilled?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listAppointments(params: ListAppointmentsParams) {
  const { data } = await api.get<{ success: boolean; appointments: Appointment[] } & PaginatedResponse<Appointment>>(
    "/api/appointments",
    { params }
  );
  return data;
}

export async function createWalkInAppointment(input: {
  clientName?: string;
  clientPhone?: string;
  category: Appointment["category"];
  staffId?: string;
  notes?: string;
  serviceIds: string[];
}) {
  const { data } = await api.post<{ success: boolean; appointment: Appointment }>("/api/appointments/walk-in", input);
  return data.appointment;
}

export async function getAppointment(id: string) {
  const { data } = await api.get<{ success: boolean; appointment: Appointment }>(`/api/appointments/${id}`);
  return data.appointment;
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const { data } = await api.patch<{ success: boolean; appointment: Appointment }>(`/api/appointments/${id}/status`, {
    status,
  });
  return data.appointment;
}

export async function proposeReschedule(
  id: string,
  input: { proposedBookingTime?: string; proposedStaffId?: string }
) {
  const { data } = await api.patch<{ success: boolean; appointment: Appointment }>(
    `/api/appointments/${id}/reschedule`,
    input
  );
  return data.appointment;
}

export async function listMessages(appointmentId: string) {
  const { data } = await api.get<{ success: boolean; messages: AppointmentMessage[] } & PaginatedResponse<AppointmentMessage>>(
    `/api/appointments/${appointmentId}/messages`,
    { params: { pageSize: 100 } }
  );
  return data.messages;
}

export async function sendMessage(
  appointmentId: string,
  input: { text?: string; attachment?: { uri: string; name: string; type: string } }
) {
  const form = new FormData();
  if (input.text) form.append("text", input.text);
  if (input.attachment) {
    // React Native's FormData accepts { uri, name, type } file objects directly —
    // this shape only works on RN, not a real browser Blob/File.
    form.append("attachment", input.attachment as unknown as Blob);
  }
  const { data } = await api.post<{ success: boolean; message: AppointmentMessage }>(
    `/api/appointments/${appointmentId}/messages`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.message;
}
