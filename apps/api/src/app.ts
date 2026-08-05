import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "@/config/env";
import { errorHandler } from "@/middlewares/errorHandler";
import { authRouter } from "@/modules/auth/auth.routes";
import { clientAuthRouter } from "@/modules/clientAuth/clientAuth.routes";
import { tenantRouter } from "@/modules/tenant/tenant.routes";
import { serviceRouter } from "@/modules/services/service.routes";
import { staffRouter } from "@/modules/staff/staff.routes";
import { appointmentRouter } from "@/modules/appointments/appointment.routes";
import { ledgerRouter } from "@/modules/ledger/ledger.routes";
import { billingRouter } from "@/modules/billing/billing.routes";
import { feedRouter } from "@/modules/feed/feed.routes";
import { reviewRouter } from "@/modules/reviews/review.routes";
import { clientRouter } from "@/modules/clients/client.routes";
import { notificationRouter } from "@/modules/notifications/notification.routes";
import { ownerNotificationRouter } from "@/modules/notifications/ownerNotification.routes";
import { analyticsRouter } from "@/modules/analytics/analytics.routes";
import { reportsRouter } from "@/modules/reports/reports.routes";
import { adminRouter } from "@/modules/admin/admin.routes";

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/client-auth", clientAuthRouter);
app.use("/api/tenants", tenantRouter);
app.use("/api/services", serviceRouter);
app.use("/api/staff", staffRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/ledger", ledgerRouter);
app.use("/api/billing", billingRouter);
app.use("/api/feed", feedRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/clients", clientRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/owner-notifications", ownerNotificationRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/admin", adminRouter);

app.use(errorHandler);
