import { apiGlobal, apiTenant, apiPlatform } from '../api/apiTenant';
import type {
  BillingCoupon,
  BillingLimitCheckResponse,
  BillingPlan,
  BillingPlanCatalog,
  BillingStatusResponse,
} from '@/types/api';

export const paymentEndpoints = {
  // ─── School Creation Checkout ──────────────────────────
  createSchoolCheckoutPublic: (data: {
    name: string;
    slug: string;
    bio?: string;
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
  }) =>
    apiGlobal
      .post<{ checkoutUrl: string; pendingId: string }>(
        '/payments/school-checkout',
        data
      )
      .then((r) => r.data),

  createSchoolCheckoutClaim: (data: {
    name: string;
    slug: string;
    bio?: string;
  }) =>
    apiPlatform
      .post<{ checkoutUrl: string; pendingId: string }>(
        '/payments/school-checkout/claim',
        data
      )
      .then((r) => r.data),

  // ─── Payment Status ────────────────────────────────────
  getPaymentStatus: (sessionId: string) =>
    apiGlobal
      .get<{ status: string; tenantId: string | null; kind: string }>(
        `/payments/status?session_id=${sessionId}`
      )
      .then((r) => r.data),

  // ─── Stripe Connect ────────────────────────────────────
  createConnectAccount: (slug: string) =>
    apiTenant(slug)
      .post<{ accountId: string }>('/payments/connect/account')
      .then((r) => r.data),

  createOnboardingLink: (slug: string) =>
    apiTenant(slug)
      .post<{ url: string }>('/payments/connect/onboarding-link')
      .then((r) => r.data),

  getConnectStatus: (slug: string) =>
    apiTenant(slug)
      .get<{
        hasAccount: boolean;
        accountId: string | null;
        onboardingComplete: boolean;
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
        detailsSubmitted: boolean;
      }>('/payments/connect/status')
      .then((r) => r.data),

  // ─── Offers ────────────────────────────────────────────
  createOffer: (
    slug: string,
    data: {
      courseId?: string;
      title: string;
      description?: string;
      type: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION';
      priceAmount?: number;
      priceCurrency?: string;
      billingInterval?: 'MONTH' | 'YEAR';
    }
  ) =>
    apiTenant(slug)
      .post('/payments/offers', data)
      .then((r) => r.data),

  listOffers: (slug: string, includeInactive = false) =>
    apiTenant(slug)
      .get(`/payments/offers${includeInactive ? '?includeInactive=true' : ''}`)
      .then((r) => r.data),

  getOffer: (slug: string, id: string) =>
    apiTenant(slug)
      .get(`/payments/offers/${id}`)
      .then((r) => r.data),

  updateOffer: (
    slug: string,
    id: string,
    data: { title?: string; description?: string; active?: boolean }
  ) =>
    apiTenant(slug)
      .patch(`/payments/offers/${id}`, data)
      .then((r) => r.data),

  // ─── Student Checkout ──────────────────────────────────
  createCheckout: (slug: string, offerId: string) =>
    apiTenant(slug)
      .post<{ checkoutUrl?: string; enrolled?: boolean; enrollmentId?: string }>(
        '/payments/checkout',
        { offerId }
      )
      .then((r) => r.data),

  // ─── Enrollments ───────────────────────────────────────
  getEnrollments: (slug: string) =>
    apiTenant(slug)
      .get('/payments/enrollments')
      .then((r) => r.data),

  checkAccess: (slug: string, courseId: string) =>
    apiTenant(slug)
      .get(`/payments/access/${courseId}`)
      .then((r) => r.data),

  // ─── Billing (tenant) ──────────────────────────────────
  getBillingStatus: (slug: string) =>
    apiTenant(slug)
      .get<BillingStatusResponse>('/payments/billing/status')
      .then((r) => r.data),

  listPlans: () =>
    apiGlobal
      .get<BillingPlanCatalog[]>('/payments/plans')
      .then((r) => r.data),

  subscribePlan: (slug: string, planId: string, couponCode?: string) =>
    apiTenant(slug)
      .post<{ checkoutUrl: string | null; sessionId?: string; message?: string }>(
        '/payments/billing/subscribe',
        { planId, couponCode }
      )
      .then((r) => r.data),

  changePlan: (slug: string, planId: string, couponCode?: string) =>
    apiTenant(slug)
      .post<{ checkoutUrl: string | null; sessionId?: string; message?: string }>(
        '/payments/billing/change-plan',
        { planId, couponCode }
      )
      .then((r) => r.data),

  cancelSubscription: (slug: string) =>
    apiTenant(slug)
      .post<{ message: string }>('/payments/billing/cancel')
      .then((r) => r.data),

  createBillingPortalSession: (slug: string) =>
    apiTenant(slug)
      .post<{ url: string }>('/payments/billing/portal')
      .then((r) => r.data),

  validateBillingCoupon: (slug: string, code: string) =>
    apiTenant(slug)
      .post<{
        valid: boolean;
        code: string;
        discountType: 'PERCENT' | 'FIXED';
        discountValue: number;
      }>('/payments/billing/coupons/validate', { code })
      .then((r) => r.data),

  checkBillingLimit: (slug: string, limitType: 'courses' | 'students') =>
    apiTenant(slug)
      .get<BillingLimitCheckResponse>(`/payments/billing/limits/${limitType}`)
      .then((r) => r.data),

  // ─── Billing (super admin) ────────────────────────────
  listAdminPlans: (activeOnly = false) =>
    apiGlobal
      .get<BillingPlan[]>(`/payments/super/plans${activeOnly ? '?activeOnly=true' : ''}`)
      .then((r) => r.data),

  createAdminPlan: (data: {
    name: string;
    label: string;
    description?: string;
    priceAmount: number;
    currency?: string;
    interval?: 'month' | 'year';
    stripePriceId?: string | null;
    features: {
      maxCourses: number;
      maxStudents: number;
      labAccess: boolean;
      analytics: boolean;
      priority: boolean;
      commissionPercent: number;
    };
    sortOrder?: number;
  }) => apiGlobal.post<BillingPlan>('/payments/super/plans', data).then((r) => r.data),

  updateAdminPlan: (
    id: string,
    data: {
      label?: string;
      description?: string;
      priceAmount?: number;
      currency?: string;
      interval?: 'month' | 'year';
      stripePriceId?: string | null;
      features?: {
        maxCourses: number;
        maxStudents: number;
        labAccess: boolean;
        analytics: boolean;
        priority: boolean;
        commissionPercent: number;
      };
      active?: boolean;
      sortOrder?: number;
    }
  ) => apiGlobal.patch<BillingPlan>(`/payments/super/plans/${id}`, data).then((r) => r.data),

  listAdminCoupons: (activeOnly = false) =>
    apiGlobal
      .get<BillingCoupon[]>(
        `/payments/super/coupons${activeOnly ? '?activeOnly=true' : ''}`
      )
      .then((r) => r.data),

  createAdminCoupon: (data: {
    code: string;
    description?: string;
    discountType: 'PERCENT' | 'FIXED';
    discountValue: number;
    maxUses?: number;
    expiresAt?: string;
  }) => apiGlobal.post<BillingCoupon>('/payments/super/coupons', data).then((r) => r.data),

  updateAdminCoupon: (
    id: string,
    data: {
      description?: string | null;
      active?: boolean;
      maxUses?: number | null;
      expiresAt?: string | null;
    }
  ) => apiGlobal.patch<BillingCoupon>(`/payments/super/coupons/${id}`, data).then((r) => r.data),
};
