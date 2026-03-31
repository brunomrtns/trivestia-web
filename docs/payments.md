# Trivestia Payment System

## 1. Overview

The payment system uses **Stripe** to handle:
- **School creation fee** — $20.00 fixed fee before a school is activated
- **Stripe Connect onboarding** — teachers configure their Connected Account to receive payouts
- **Offer management** — FREE, ONE_TIME, and SUBSCRIPTION offers linked to courses
- **Student checkout** — Stripe Checkout for paid offers, direct enrollment for free ones
- **Webhook processing** — idempotent event handling via `PaymentEvent` model

## 2. Architecture

```
Student Browser ──► Stripe Checkout ──► Stripe Webhook ──► Backend (fulfill)
     │                                       │
     └── PaymentSuccessPage (polls status)───┘

Teacher ──► OnboardingPage ──► Stripe Connect ──► Webhook (account.updated)
Admin   ──► AdminOffersPage ──► CRUD offers via API
```

### Revenue Share

- One-time payments: `application_fee_amount` (platform fee in cents)
- Subscriptions: `application_fee_percent` (percentage taken by platform)
- Configured via `PLATFORM_FEE_PERCENT` env var (default: 20%)

## 3. Database Models

### New Enums
| Enum | Values |
|------|--------|
| `OfferType` | `FREE`, `ONE_TIME`, `SUBSCRIPTION` |
| `BillingInterval` | `MONTH`, `YEAR` |
| `PaymentKind` | `SCHOOL_CREATION`, `ONE_TIME`, `SUBSCRIPTION_INITIAL`, `SUBSCRIPTION_RECURRING` |
| `PaymentStatus` | `PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED` |
| `AccessStatus` | `ACTIVE`, `PENDING`, `FAILED`, `CANCELED` |
| `TenantActivationStatus` | `PENDING_PAYMENT`, `ACTIVE` |

### New Models
| Model | Purpose |
|-------|---------|
| `PendingSchoolCreation` | Temporary record before payment confirms school creation |
| `Offer` | Pricing offer linked to a course (or tenant-wide) |
| `Enrollment` | Student enrollment with access and payment status |
| `Payment` | Individual payment record linked to enrollment |
| `PaymentEvent` | Webhook event idempotency log (prevents duplicate processing) |

### Tenant Model Additions
- `defaultCurrency` — default currency for offers (e.g., "usd")
- `stripeConnectedAccountId` — Stripe Connect account ID
- `stripeOnboardingComplete` — whether Connect onboarding is done
- `activationStatus` — `PENDING_PAYMENT` or `ACTIVE`

## 4. API Endpoints

### Global (no tenant context)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments/school-checkout` | None | Public: create school + redirect to Stripe |
| POST | `/payments/school-checkout/claim` | Platform token | Authenticated professor school creation |
| GET | `/payments/status?session_id=` | None | Poll payment status |
| POST | `/payments/webhooks` | Stripe sig | Webhook handler (raw body) |

### Tenant-scoped (`/t/:slug/payments/...`)
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/payments/connect/account` | OWNER | Create Stripe Connect account |
| POST | `/payments/connect/onboarding-link` | OWNER | Generate onboarding link |
| GET | `/payments/connect/status` | OWNER | Check Connect status |
| POST | `/payments/offers` | ADMIN/OWNER | Create offer |
| GET | `/payments/offers` | Authenticated | List offers |
| GET | `/payments/offers/:id` | Authenticated | Get offer |
| PATCH | `/payments/offers/:id` | ADMIN/OWNER | Update offer |
| POST | `/payments/checkout` | Authenticated | Purchase/enroll in offer |
| GET | `/payments/enrollments` | Authenticated | List user enrollments |
| GET | `/payments/access/:courseId` | Authenticated | Check course access |

## 5. Webhook Events

| Stripe Event | Handler Action |
|-------------|----------------|
| `checkout.session.completed` | Fulfill school creation or student enrollment |
| `payment_intent.succeeded` | Update payment status to SUCCEEDED |
| `payment_intent.payment_failed` | Update payment status to FAILED |
| `invoice.paid` | Activate enrollment for recurring subscription |
| `invoice.payment_failed` | Mark subscription payment as failed |
| `customer.subscription.updated` | Sync enrollment with Stripe subscription status |
| `customer.subscription.deleted` | Cancel enrollment, remove access |

All webhook handlers check `PaymentEvent` for idempotency before processing.

## 6. Environment Variables

### Backend (`trademaster-api/.env`)
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SCHOOL_CREATION_FEE_AMOUNT=2000        # cents ($20.00)
SCHOOL_CREATION_FEE_CURRENCY=usd
PLATFORM_FEE_PERCENT=20               # 20% platform fee
FRONTEND_URL=http://localhost:5173/trivestia
```

### Frontend (`trivestia-web`)
No env vars required — Stripe Checkout uses server-side redirects, not client-side Stripe.js.

## 7. Frontend Pages

| Page | Route | Purpose |
|------|-------|---------|
| `CreateSchoolPage` (public) | `/create-school` | Form → Stripe Checkout redirect |
| `CreateSchoolPage` (workspace) | `/workspace/create-school` | Authenticated version → claim checkout |
| `PaymentSuccessPage` | `/payment/success` | Polls payment status, shows result |
| `PaymentCancelPage` | `/payment/cancel` | Payment cancelled message |
| `OnboardingPage` | `/workspace/onboarding` | Stripe Connect onboarding for teachers |
| `AdminOffersPage` | `/t/:slug/admin/offers` | CRUD offers management |

## 8. Payment Flows

### School Creation (Public)
1. User fills form on `/create-school`
2. Frontend calls `POST /payments/school-checkout`
3. Backend creates `PendingSchoolCreation` + Stripe Checkout Session
4. Frontend redirects to `checkoutUrl`
5. User pays on Stripe
6. Stripe sends `checkout.session.completed` webhook
7. Backend creates Tenant + User + Enrollment, marks tenant as ACTIVE
8. User lands on `/payment/success`, polls status
9. Status confirmed → redirect to login

### Student Enrollment (Free Offer)
1. Student clicks "Enroll" button
2. Frontend calls `POST /t/:slug/payments/checkout`
3. Backend creates Enrollment with `accessStatus: ACTIVE` immediately
4. Returns `{ enrolled: true, enrollmentId }`
5. Frontend shows success toast

### Student Enrollment (Paid Offer)
1. Student clicks "Buy" button
2. Frontend calls `POST /t/:slug/payments/checkout`
3. Backend creates Payment + Enrollment (PENDING) + Stripe Checkout Session
4. Returns `{ checkoutUrl }`
5. Frontend redirects to Stripe
6. Webhook `checkout.session.completed` → marks payment SUCCEEDED, enrollment ACTIVE
7. Student lands on `/payment/success`, polls until confirmed

## 9. Key Files

### Backend (`trademaster-api/src/modules/payments/`)
- `stripe.service.ts` — Stripe client singleton, fee calculation, env config
- `payments.dto.ts` — Zod validation schemas
- `payments.service.ts` — Core business logic
- `payments.controller.ts` — Express request handlers
- `payments.routes.ts` — Route definitions
- `webhooks.controller.ts` — Webhook handler with idempotency

### Frontend (`trivestia-web/src/`)
- `services/endpoints/payment.endpoints.ts` — API client functions
- `types/api.ts` — TypeScript interfaces (Offer, Enrollment, etc.)
- `pages/payment/` — PaymentSuccessPage, PaymentCancelPage
- `pages/workspace/OnboardingPage.tsx` — Connect onboarding
- `pages/admin/AdminOffersPage.tsx` — Offer management
- `pages/public/CreateSchoolPage.tsx` — Public school creation (→ Stripe)
- `pages/workspace/CreateSchoolPage.tsx` — Workspace school creation (→ Stripe)
- `components/payment/OfferCheckoutButton.tsx` — Reusable checkout button
