import { apiGlobal, apiTenant, apiPlatform } from '../api/apiTenant';

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
};
