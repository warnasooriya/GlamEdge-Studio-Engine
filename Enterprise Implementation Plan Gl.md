# Enterprise Implementation Plan: **GlamEdge Studio Engine** (Salon SaaS Application)

---

## Architecture Overview

```
[ Mobile / Web Frontend (React + TypeScript + PWA) ]
                         │
          (REST APIs / WebSockets / JWT Auth)
                         │
                         ▼
     [ Enterprise Node.js (Express + TypeScript) ]
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     [ MySQL 8.0 ]   [ MongoDB ]    [ AWS S3 ]
  (Relational Engine) (Social Feed) (Media Bucket)

```

---

## Key Strategic & Architectural Decisions

* **Database Pivot to MySQL 8.0:** The relational schema leverages **MySQL 8.0+ InnoDB Engine** featuring multi-tenant isolation, JSON column support, transactional integrity, and optimized index execution.
* **ORM Layer:** **Prisma ORM** configured specifically for the `mysql` provider.
* **Architecture:** Multi-Tenant SaaS with dynamic Subdomain/Slug routing (`glamedge.app/:salon-slug`).
* **UI/UX Standard:** Mobile-First Responsive PWA, Glassmorphism Aesthetics (Tailwind CSS + Shadcn UI), single-tap touch operations.

---

## 1. System Architecture & Tech Stack

```
├── Frontend Architecture
│   ├── Framework: React 18+ (TypeScript) + Vite
│   ├── UI Components: Tailwind CSS + Shadcn UI + Lucide Icons
│   ├── State Management: Redux Toolkit (Global Auth/Tenant Context)
│   ├── Server State & Caching: React Query (TanStack Query v5)
│   └── Mobile Layer: Progressive Web App (PWA) with Service Workers
│
├── Backend Architecture
│   ├── Runtime: Node.js (v20+ LTS) + Express.js (TypeScript)
│   ├── Database ORM: Prisma ORM (Configured for MySQL 8.0)
│   ├── Auth: JWT + SMS OTP Authentication Engine
│   ├── Media Storage: AWS S3 + CloudFront CDN
│   └── Real-time Layer: Socket.io (Live Calendar Grid Sync)
│
└── Database Layer
    ├── Core Relational Database: MySQL 8.0 (Relational Tenants, Billing, Ledger, Bookings)
    └── Document Database: MongoDB Atlas (Unstructured Posts, Likes, Comments, Tags)

```

---

## 2. Complete Database Schema (MySQL 8.0 via Prisma)

```prisma
// prisma/schema.prisma

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum CategoryType {
  LADIES
  GENTS
  KIDS
}

enum SubscriptionTier {
  STARTER
  PRO
  ENTERPRISE
}

enum LedgerType {
  INCOME
  EXPENSE
}

enum PaymentMode {
  CASH
  CARD
  ONLINE
  LANKAQR
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}

model Tenant {
  id           String           @id @default(uuid())
  salonName    String           @db.VarChar(191)
  slug         String           @unique @db.VarChar(191)
  phone        String           @unique @db.VarChar(50)
  ownerName    String           @db.VarChar(191)
  subscription SubscriptionTier @default(STARTER)
  isActive     Boolean          @default(true)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  services     Service[]
  staff        Staff[]
  appointments Appointment[]
  ledgers      Ledger[]
  reviews      Review[]

  @@map("tenants")
}

model Service {
  id          String       @id @default(uuid())
  tenantId    String
  tenant      Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  category    CategoryType
  name        String       @db.VarChar(191)
  price       Decimal      @db.Decimal(10, 2)
  durationMin Int          @default(30)
  isActive    Boolean      @default(true)
  createdAt   DateTime     @default(now())

  appointments AppointmentService[]

  @@index([tenantId])
  @@map("services")
}

model Staff {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String   @db.VarChar(191)
  phone       String?  @db.VarChar(50)
  role        String   @default("Stylist") @db.VarChar(100)
  commission  Decimal  @default(0.00) @db.Decimal(5, 2)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  appointments Appointment[]

  @@index([tenantId])
  @@map("staff")
}

model Appointment {
  id          String            @id @default(uuid())
  tenantId    String
  tenant      Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  staffId     String?
  staff       Staff?            @relation(fields: [staffId], references: [id], onDelete: SetNull)
  clientName  String            @db.VarChar(191)
  clientPhone String            @db.VarChar(50)
  category    CategoryType
  bookingTime DateTime
  status      AppointmentStatus @default(PENDING)
  isBilled    Boolean           @default(false)
  notes       String?           @db.Text
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  services AppointmentService[]
  ledger   Ledger?
  review   Review?

  @@index([tenantId])
  @@index([bookingTime])
  @@map("appointments")
}

model AppointmentService {
  appointmentId String
  serviceId     String
  price         Decimal     @db.Decimal(10, 2)
  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  service       Service     @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@id([appointmentId, serviceId])
  @@map("appointment_services")
}

model Ledger {
  id            String       @id @default(uuid())
  tenantId      String
  tenant        Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  appointmentId String?      @unique
  appointment   Appointment? @relation(fields: [appointmentId], references: [id], onDelete: SetNull)
  type          LedgerType
  amount        Decimal      @db.Decimal(10, 2)
  category      String       @db.VarChar(100)
  paymentMode   PaymentMode  @default(CASH)
  description   String?      @db.VarChar(255)
  createdAt     DateTime     @default(now())

  @@index([tenantId])
  @@index([createdAt])
  @@map("ledgers")
}

model Review {
  id            String      @id @default(uuid())
  tenantId      String
  tenant        Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  appointmentId String      @unique
  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  clientName    String      @db.VarChar(191)
  rating        Int         @default(5)
  comment       String?     @db.Text
  isVerified    Boolean     @default(true)
  createdAt     DateTime    @default(now())

  @@index([tenantId])
  @@map("reviews")
}

```

---

## 3. Directory Structure Specification

```
glamedge-saas/
├── apps/
│   ├── web/                         # React Frontend (Vite + TS)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/              # Shadcn Components
│   │   │   │   ├── booking/         # Availability Calendar Grid
│   │   │   │   ├── ledger/          # POS & Expense Form
│   │   │   │   ├── feed/            # Social Showcase Components
│   │   │   │   └── shared/          # Category Badges (Ladies/Gents/Kids)
│   │   │   ├── hooks/               # Custom Hooks (useAuth, useTenant)
│   │   │   ├── pages/
│   │   │   │   ├── auth/            # OTP Onboarding Flow
│   │   │   │   ├── dashboard/       # Salon Owner Financial Control
│   │   │   │   ├── public/          # Client Booking & Feed View
│   │   │   │   └── pos/             # One-Tap Billing Interface
│   │   │   ├── store/               # Redux Toolkit Stores
│   │   │   ├── types/               # TypeScript Definitions
│   │   │   └── App.tsx
│   │   ├── tailwind.config.js
│   │   └── vite.config.ts
│   │
│   └── api/                         # Node.js Express Backend
│       ├── src/
│       │   ├── config/              # MySQL, Mongo, Redis Configuration
│       │   ├── controllers/         # Auth, Booking, Ledger, Feed Controllers
│       │   ├── middlewares/         # Multi-Tenant Isolation Middleware
│       │   ├── routes/              # Express API Routes
│       │   ├── services/            # WhatsApp API, PDF Generator, AWS S3
│       │   ├── utils/               # MySQL Helpers, Math Engines
│       │   └── index.ts
│       ├── prisma/
│       │   └── schema.prisma        # Prisma MySQL Schema
│       └── package.json

```

---

## 4. Feature Modules Implementation Breakdown

### Module 1: Multi-Tenant Onboarding Engine (100% Online)

```typescript
// api/src/middlewares/tenantResolver.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TenantRequest extends Request {
  tenantId?: string;
  tenantSlug?: string;
}

export const tenantResolver = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  const host = req.headers.host || '';
  const subdomain = host.split('.')[0];
  const headerTenantId = req.headers['x-tenant-id'] as string;

  try {
    let tenant;
    if (headerTenantId) {
      tenant = await prisma.tenant.findUnique({ where: { id: headerTenantId } });
    } else if (subdomain && subdomain !== 'www' && subdomain !== 'glamedge') {
      tenant = await prisma.tenant.findUnique({ where: { slug: subdomain } });
    }

    if (!tenant || !tenant.isActive) {
      return res.status(404).json({ error: 'Salon Workspace Not Found or Inactive' });
    }

    req.tenantId = tenant.id;
    req.tenantSlug = tenant.slug;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Multi-Tenant Resolution Error' });
  }
};

```

---

### Module 2: Instant E-Billing & WhatsApp Engine

```typescript
// api/src/services/whatsappService.ts
import axios from 'axios';

interface WhatsAppInvoicePayload {
  clientPhone: string;
  clientName: string;
  salonName: string;
  totalAmount: string;
  pdfInvoiceUrl: string;
}

export const sendWhatsAppInvoice = async (payload: WhatsAppInvoicePayload) => {
  const { clientPhone, clientName, salonName, totalAmount, pdfInvoiceUrl } = payload;
  
  const formattedPhone = clientPhone.startsWith('0') 
    ? `94${clientPhone.slice(1)}` 
    : clientPhone;

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'salon_invoice_receipt',
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: clientName },
                { type: 'text', text: salonName },
                { type: 'text', text: totalAmount },
                { type: 'text', text: pdfInvoiceUrl }
              ]
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    throw new Error('WhatsApp dispatch failed');
  }
};

```

---

### Module 3: Verified Review Engine Logic

```typescript
// api/src/controllers/reviewController.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TenantRequest } from '../middlewares/tenantResolver';

const prisma = new PrismaClient();

export const createVerifiedReview = async (req: TenantRequest, res: Response) => {
  const { appointmentId, rating, comment } = req.body;
  const tenantId = req.tenantId!;

  try {
    // 1. Verify that appointment exists, belongs to tenant, and is completed/billed
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        tenantId: tenantId,
        status: 'COMPLETED',
        isBilled: true
      }
    });

    if (!appointment) {
      return res.status(400).json({ 
        error: 'Only clients with a completed and billed appointment can leave reviews.' 
      });
    }

    // 2. Prevent duplicate reviews for the same appointment
    const existingReview = await prisma.review.findUnique({
      where: { appointmentId }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Review already submitted for this visit.' });
    }

    // 3. Create verified review
    const review = await prisma.review.create({
      data: {
        tenantId,
        appointmentId,
        clientName: appointment.clientName,
        rating: Number(rating),
        comment,
        isVerified: true
      }
    });

    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to submit review' });
  }
};

```

---

## 5. UI/UX Design Token Specifications

```typescript
// web/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: "#F472B6",    // Category: Ladies
          navy: "#1E293B",    // Category: Gents
          amber: "#F59E0B",   // Category: Kids
          gold: "#D97706",    // Enterprise Accents
        },
        glass: {
          surface: "rgba(255, 255, 255, 0.75)",
          border: "rgba(226, 232, 240, 0.8)",
          darkSurface: "rgba(15, 23, 42, 0.85)"
        }
      },
      backdropBlur: {
        xs: '2px',
        glass: '12px',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}

```

---

## 6. Development & Deployment Roadmap

```
Phase 1: Database Setup & Infrastructure (Weeks 1-2)
  ├── MySQL 8.0 Schema Initialization & Index Optimization
  ├── Express.js + Prisma Setup & Multi-Tenant Middleware
  └── Authentication Service (OTP Verification Logic)

Phase 2: Operational Engine & Billing (Weeks 3-4)
  ├── POS & Daily Ledger React Modules
  ├── MySQL Transaction Isolation Setup
  └── PDF Generation Microservice & WhatsApp Cloud API Integration

Phase 3: Booking Grid & Category Routing (Weeks 5-6)
  ├── Real-time Interactive Availability Grid (Socket.io + FullCalendar)
  ├── Ladies, Gents, Kids Segmentation Filters
  └── Booking Notification Triggers

Phase 4: Social Feed & Verified Review Loop (Weeks 7-8)
  ├── AWS S3 Upload Controller (Image Compression & CDN CDN Delivery)
  ├── Feed Page (Infinite Scroll + Category Tags)
  └── Verified Review Logic Enforcement (Paid Invoice Check)

Phase 5: PWA Polish & Production Deployment (Weeks 9-10)
  ├── Tailwind PWA Manifest & Service Worker Registration
  ├── AWS Infrastructure Setup (EC2/ECS, RDS MySQL, S3)
  └── Domain Routing, SSL, and Final Security Audits

```

---

## 7. Operational Checklist for Go-Live

* [ ] Configured MySQL `DATABASE_URL` with connection pooling flags (`?connection_limit=20&pool_timeout=30`).
* [ ] Ran `npx prisma migrate dev` and verified index creations on foreign key columns (`tenantId`).
* [ ] Verified WhatsApp Cloud API token authentication and registered template message approval.
* [ ] Tested multi-tenant database isolation (validated that Tenant A cannot access Tenant B's ledger or appointments).
* [ ] Set up S3 bucket policy for public media assets and restricted upload policies.
* [ ] Validated PWA offline capability for basic POS ledger view.