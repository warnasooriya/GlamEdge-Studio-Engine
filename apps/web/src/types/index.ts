export type CategoryType = "LADIES" | "GENTS" | "KIDS";
export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type PaymentMode = "CASH" | "CARD" | "ONLINE" | "LANKAQR";
export type LedgerType = "INCOME" | "EXPENSE";

export interface Tenant {
  id: string;
  salonName: string;
  slug: string;
  phone: string;
  ownerName: string;
  subscription: "STARTER" | "PRO" | "ENTERPRISE";
  isActive: boolean;
}

export interface Service {
  id: string;
  tenantId: string;
  category: CategoryType;
  name: string;
  price: string;
  durationMin: number;
  isActive: boolean;
}

export interface Staff {
  id: string;
  tenantId: string;
  name: string;
  phone?: string | null;
  role: string;
  commission: string;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  tenantId: string;
  staffId?: string | null;
  staff?: Staff | null;
  clientName: string;
  clientPhone: string;
  category: CategoryType;
  bookingTime: string;
  status: AppointmentStatus;
  isBilled: boolean;
  notes?: string | null;
  services: { serviceId: string; price: string; service: Service }[];
}

export interface LedgerEntry {
  id: string;
  tenantId: string;
  appointmentId?: string | null;
  type: LedgerType;
  amount: string;
  category: string;
  paymentMode: PaymentMode;
  description?: string | null;
  createdAt: string;
}

export interface FeedPost {
  _id: string;
  tenantId: string;
  staffName?: string;
  category: CategoryType;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  tags: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment?: string | null;
  isVerified: boolean;
  createdAt: string;
}
