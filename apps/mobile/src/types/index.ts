// Adapted from apps/web/src/types/index.ts — kept in sync manually for now
// (see the mobile implementation plan for why this isn't a shared package yet).

export type CategoryType = "LADIES" | "GENTS" | "KIDS";
export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type RescheduleStatus = "NONE" | "PROPOSED";
export type TenantStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type SubscriptionCycle = "MONTHLY" | "YEARLY";
export type PaymentMode = "CASH" | "CARD" | "ONLINE" | "LANKAQR" | "PAYPAL";
export type LedgerType = "INCOME" | "EXPENSE";
export type PaypalPaymentStatus = "PENDING" | "COMPLETED" | "CANCELLED";

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
  paypalEmail?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  workingDays?: number[] | null;
  status: TenantStatus;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  subscriptionCycle: SubscriptionCycle;
  subscriptionFee: string;
  subscriptionStartedAt?: string | null;
  subscriptionExpiresAt?: string | null;
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

export interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment?: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  tenantId: string;
  staffId?: string | null;
  staff?: Staff | null;
  clientId?: string | null;
  clientName: string;
  clientPhone: string;
  category: CategoryType;
  bookingTime: string;
  status: AppointmentStatus;
  isBilled: boolean;
  notes?: string | null;
  rescheduleStatus: RescheduleStatus;
  proposedBookingTime?: string | null;
  proposedStaff?: Staff | null;
  services: { serviceId: string; price: string; service: Service }[];
  review?: Review | null;
  paypalPayment?: { id: string; status: PaypalPaymentStatus } | null;
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
  | "INVOICE_READY"
  | "RESCHEDULE_PROPOSED"
  | "RESCHEDULE_ACCEPTED"
  | "RESCHEDULE_DECLINED"
  | "NEW_MESSAGE"
  | "REVIEW_SUBMITTED"
  | "SUBSCRIPTION_EXPIRING"
  | "SUBSCRIPTION_EXPIRED";

export interface OwnerNotification {
  id: string;
  tenantId: string;
  appointmentId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface MessageAttachment {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface AppointmentMessage {
  _id: string;
  appointmentId: string;
  tenantId: string;
  senderType: "OWNER" | "CLIENT";
  senderName: string;
  text?: string;
  attachment?: MessageAttachment;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// --- Ledger / Overview ---

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

export interface LedgerReconciliation {
  date: string;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  cashDrawer: number;
  byPaymentMode: Record<string, number>;
  entryCount: number;
}

// --- Analytics ---

export interface AnalyticsOverview {
  range: { days: number; from: string; to: string };
  totals: { revenue: number; bookings: number; avgRating: number; reviewCount: number };
  revenueTrend: { date: string; revenue: number }[];
  bookingsByStatus: { status: AppointmentStatus; count: number }[];
  bookingsByCategory: { category: CategoryType; count: number }[];
  topServices: { name: string; revenue: number; count: number }[];
  ratingDistribution: { rating: number; count: number }[];
  peakTimes: { dayOfWeek: number; hour: number; count: number }[];
}

// --- Reports ---

export interface RevenueReportData {
  range: { from: string; to: string };
  totals: { income: number; expense: number; net: number };
  byDay: { date: string; income: number; expense: number }[];
  byPaymentMode: { paymentMode: PaymentMode; amount: number; count: number }[];
}

export interface CancellationReportData {
  range: { from: string; to: string };
  totals: { cancelledCount: number; totalBookings: number; cancellationRate: number; lostRevenue: number };
  appointments: Appointment[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface MissedAppointmentsReportData {
  range: { from: string; to: string };
  totals: { missedCount: number };
  appointments: Appointment[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface StaffCommissionSummary {
  range: { from: string; to: string };
  staff: {
    staffId: string;
    staffName: string;
    role: string;
    appointmentsCount: number;
    revenue: number;
    commissionRate: number;
    commissionEarned: number;
  }[];
  totals: { totalRevenue: number; totalCommission: number };
}

export interface StaffCommissionDetail {
  range: { from: string; to: string };
  staff: { id: string; name: string; commissionRate: number };
  appointments: {
    id: string;
    bookingTime: string;
    clientName: string;
    services: string[];
    revenue: number;
    commissionEarned: number;
  }[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// --- Showcase Feed ---

export interface FeedMediaItem {
  url: string;
  type: "image" | "video";
  width?: number;
  height?: number;
}

export interface FeedPost {
  _id: string;
  tenantId: string;
  staffId?: string;
  staffName?: string;
  category: CategoryType;
  media: FeedMediaItem[];
  caption?: string;
  tags: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

// --- Billing ---

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

export interface CreateInvoiceResult {
  invoiceUrl?: string;
  receiptImageUrl?: string;
  totalAmount: number;
  whatsappSent: boolean;
  hasPhone: boolean;
  payUrl?: string;
  paypalPaymentId?: string;
}
