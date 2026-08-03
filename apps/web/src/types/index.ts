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
  logoUrl?: string | null;
  address?: string | null;
  mapLink?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  contactPhone?: string | null;
}

export interface Client {
  id: string;
  phone: string;
  name: string;
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

export interface FeedMediaItem {
  url: string;
  type: "image" | "video";
  width?: number;
  height?: number;
}

export interface FeedPost {
  _id: string;
  tenantId: string;
  staffName?: string;
  category: CategoryType;
  media: FeedMediaItem[];
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

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  visitCount: number;
  completedCount: number;
  lastVisit: string;
  avgRating: number | null;
  reviewCount: number;
}

export interface CustomerDetail {
  client: { id: string; name: string; phone: string; createdAt: string };
  appointments: Appointment[];
  reviews: Review[];
}

export type NotificationType =
  | "BOOKING_REQUESTED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "REVIEW_THANKS"
  | "INVOICE_READY";

export interface AppNotification {
  id: string;
  clientId: string;
  tenantId: string;
  appointmentId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  tenant: { salonName: string; slug: string; logoUrl?: string | null };
}

export interface ClientAppointment extends Appointment {
  tenant: { salonName: string; slug: string; logoUrl?: string | null };
}

export interface Invoice {
  id: string;
  appointmentId: string;
  clientName: string;
  clientPhone: string;
  services: string[];
  amount: string;
  paymentMode: PaymentMode;
  createdAt: string;
  invoiceUrl: string;
  receiptImageUrl: string;
}
