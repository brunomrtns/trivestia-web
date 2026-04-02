import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Loader2, Crown, ShieldAlert, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { paymentEndpoints } from '@/services/endpoints/payment.endpoints';
import { useAuthStore } from '@/features/auth/auth.store';

function getApiErrorMessage(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const withResponse = error as { response?: { data?: { message?: string } } };
  return withResponse.response?.data?.message;
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export default function AdminBillingPage() {
  const { t } = useTranslation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug ?? '';
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [couponCode, setCouponCode] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const canManageBilling = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN';

  const statusQuery = useQuery({
    queryKey: ['billing-status', slug],
    queryFn: () => paymentEndpoints.getBillingStatus(slug),
    enabled: !!slug,
  });

  const plansQuery = useQuery({
    queryKey: ['billing-plans-catalog'],
    queryFn: () => paymentEndpoints.listPlans(),
  });

  const activeSubscription = statusQuery.data?.subscription;
  const hasPaidSubscription =
    !!activeSubscription &&
    ['ACTIVE', 'TRIALING', 'PAST_DUE', 'UNPAID', 'INCOMPLETE'].includes(activeSubscription.status);

  const actionMutation = useMutation({
    mutationFn: async (planId: string) => {
      if (hasPaidSubscription) {
        return paymentEndpoints.changePlan(slug, planId, couponCode || undefined);
      }
      return paymentEndpoints.subscribePlan(slug, planId, couponCode || undefined);
    },
    onSuccess: (result) => {
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      toast.success(result.message ?? t('admin.billing.toast.planUpdated'));
      qc.invalidateQueries({ queryKey: ['billing-status', slug] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error) ?? t('admin.billing.toast.planChangeError'));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => paymentEndpoints.cancelSubscription(slug),
    onSuccess: (result) => {
      toast.success(result.message);
      qc.invalidateQueries({ queryKey: ['billing-status', slug] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error) ?? t('admin.billing.toast.cancelError'));
    },
  });

  const portalMutation = useMutation({
    mutationFn: () => paymentEndpoints.createBillingPortalSession(slug),
    onSuccess: (result) => {
      window.location.href = result.url;
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error) ??
          t('admin.billing.toast.portalError')
      );
    },
  });

  const couponMutation = useMutation({
    mutationFn: (code: string) => paymentEndpoints.validateBillingCoupon(slug, code),
    onSuccess: (result) => {
      const discountLabel =
        result.discountType === 'PERCENT'
          ? `${result.discountValue}%`
          : String(result.discountValue);
      toast.success(
        t('admin.billing.toast.couponValid', { discount: discountLabel })
      );
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error) ?? t('admin.billing.toast.couponInvalid'));
    },
  });

  const usageRows = useMemo(() => {
    const usage = statusQuery.data?.usage;
    const limits = statusQuery.data?.limits;
    if (!usage || !limits) return [];
    return [
      {
        label: t('admin.billing.usage.courses'),
        current: usage.courses,
        limit: limits.maxCourses,
      },
      {
        label: t('admin.billing.usage.students'),
        current: usage.students,
        limit: limits.maxStudents,
      },
    ];
  }, [statusQuery.data, t]);

  const getPlanDescription = (plan?: { name?: string; description?: string } | null) => {
    if (!plan?.name) {
      return plan?.description ?? t('admin.billing.currentPlan.defaultDescription');
    }

    if (plan.name === 'FREE') return t('admin.billing.planDescriptions.free');
    if (plan.name === 'PRO') return t('admin.billing.planDescriptions.pro');
    if (plan.name === 'ELITE') return t('admin.billing.planDescriptions.elite');

    return plan.description ?? t('admin.billing.currentPlan.defaultDescription');
  };

  if (statusQuery.isLoading || plansQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (statusQuery.isError || plansQuery.isError || !statusQuery.data) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {t('admin.billing.error.load')}
      </div>
    );
  }

  const currentPlan = statusQuery.data.plan;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('admin.billing.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('admin.billing.subtitle')}
        </p>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('admin.billing.currentPlan.label')}</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-semibold">
              <Crown className="h-5 w-5 text-amber-500" />
              {currentPlan?.label ?? 'FREE'}
            </p>
            <p className="text-sm text-muted-foreground">
              {getPlanDescription(currentPlan)}
            </p>
          </div>

          <div className="text-sm">
            <p>
              <span className="text-muted-foreground">{t('admin.billing.currentPlan.platformCommission')} </span>
              <span className="font-semibold">{statusQuery.data.limits.commissionPercent}%</span>
            </p>
            <p>
              <span className="text-muted-foreground">{t('admin.billing.currentPlan.lab')} </span>
              <span className={statusQuery.data.limits.labAccess ? 'font-semibold text-emerald-600' : 'font-semibold text-amber-600'}>
                {statusQuery.data.limits.labAccess ? t('admin.billing.currentPlan.available') : t('admin.billing.currentPlan.unavailable')}
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">{t('admin.billing.usage.title')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {usageRows.map((item) => {
            const overLimit = item.current >= item.limit;
            return (
              <div
                key={item.label}
                className={`rounded-lg border p-4 ${overLimit ? 'border-amber-500/40 bg-amber-500/5' : ''}`}
              >
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-xl font-semibold">
                  {item.current} / {item.limit}
                </p>
                {overLimit && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-amber-700">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {t('admin.billing.usage.limitReached')}
                  </p>
                )}
              </div>
            );
          })}
          <div
            className={`rounded-lg border p-4 ${!statusQuery.data.limits.labAccess ? 'border-amber-500/40 bg-amber-500/5' : ''}`}
          >
            <p className="text-sm text-muted-foreground">{t('admin.billing.usage.labAccess')}</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-semibold">
              <FlaskConical className="h-5 w-5" />
              {statusQuery.data.limits.labAccess ? t('admin.billing.usage.active') : t('admin.billing.usage.blocked')}
            </p>
            {!statusQuery.data.limits.labAccess && (
              <p className="mt-2 text-xs text-amber-700">
                {t('admin.billing.usage.labUpgradeHint')}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t('admin.billing.catalog.title')}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder={t('admin.billing.catalog.couponPlaceholder')}
              className="rounded-md border px-3 py-2 text-sm"
            />
            <button
              onClick={() => couponMutation.mutate(couponCode)}
              disabled={!couponCode || couponMutation.isPending}
              className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              {t('admin.billing.catalog.validateCoupon')}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {plansQuery.data?.map((plan) => {
            const isCurrent = currentPlan?.id === plan.id;
            const selected = selectedPlanId === plan.id;
            const displayPrice = plan.displayPrice;
            const paidPlanWithoutStripePrice =
              displayPrice.amount > 0 && !plan.stripePriceId;
            const paidPlanWithFallbackPrice =
              displayPrice.amount > 0 &&
              !!plan.stripePriceId &&
              displayPrice.source === 'fallback';
            return (
              <div
                key={plan.id}
                className={`rounded-lg border p-4 ${isCurrent ? 'border-primary ring-1 ring-primary/30' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{plan.label}</p>
                    <p className="text-xs text-muted-foreground">{plan.name}</p>
                  </div>
                  {isCurrent && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {t('admin.billing.catalog.current')}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-2xl font-bold">
                  {displayPrice.amount === 0
                    ? t('admin.billing.catalog.free')
                    : `${formatMoney(displayPrice.amount, displayPrice.currency)} / ${t(`admin.billing.interval.${displayPrice.interval}`)}`}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">{getPlanDescription(plan)}</p>

                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <li>{t('admin.billing.catalog.maxCourses', { count: plan.features.maxCourses })}</li>
                  <li>{t('admin.billing.catalog.maxStudents', { count: plan.features.maxStudents })}</li>
                  <li>{t('admin.billing.catalog.lab', { value: plan.features.labAccess ? t('admin.billing.yes') : t('admin.billing.no') })}</li>
                  <li>{t('admin.billing.catalog.commission', { value: plan.features.commissionPercent })}</li>
                </ul>

                {paidPlanWithoutStripePrice && (
                  <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-700">
                    {t('admin.billing.catalog.unavailableMissingStripe')}
                  </p>
                )}

                {paidPlanWithFallbackPrice && (
                  <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-700">
                    {t('admin.billing.catalog.fallbackStripeWarning')}
                  </p>
                )}

                <button
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    actionMutation.mutate(plan.id);
                  }}
                  disabled={
                    isCurrent ||
                    !canManageBilling ||
                    actionMutation.isPending ||
                    paidPlanWithoutStripePrice
                  }
                  className={`mt-4 w-full rounded-md px-3 py-2 text-sm font-semibold transition ${
                    isCurrent
                      ? 'cursor-not-allowed border bg-muted text-muted-foreground'
                      : 'bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50'
                  }`}
                >
                  {paidPlanWithoutStripePrice
                    ? t('admin.billing.catalog.unavailable')
                    : actionMutation.isPending && selected
                      ? t('admin.billing.catalog.processing')
                      : isCurrent
                        ? t('admin.billing.catalog.currentPlan')
                        : t('admin.billing.catalog.selectPlan')}
                </button>
              </div>
            );
          })}
        </div>

        {!canManageBilling && (
          <p className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700">
            {t('admin.billing.permissions.ownerOnly')}
          </p>
        )}
      </section>

      <section className="flex flex-wrap gap-2">
        <button
          onClick={() => portalMutation.mutate()}
          disabled={!canManageBilling || portalMutation.isPending}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          {t('admin.billing.actions.openPortal')}
        </button>
        <button
          onClick={() => cancelMutation.mutate()}
          disabled={!canManageBilling || cancelMutation.isPending}
          className="rounded-md border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          {t('admin.billing.actions.cancelEndOfCycle')}
        </button>
      </section>

      <p className="text-xs text-muted-foreground">
        {t('admin.billing.footer')}
      </p>
    </div>
  );
}
