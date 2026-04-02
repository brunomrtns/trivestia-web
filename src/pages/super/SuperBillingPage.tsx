import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Ticket, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { paymentEndpoints } from '@/services/endpoints/payment.endpoints';

function getApiErrorMessage(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const withResponse = error as { response?: { data?: { message?: string } } };
  return withResponse.response?.data?.message;
}

export default function SuperBillingPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [stripePriceDrafts, setStripePriceDrafts] = useState<Record<string, string>>({});

  const [newPlan, setNewPlan] = useState({
    name: '',
    label: '',
    description: '',
    priceAmount: 0,
    currency: 'usd',
    interval: 'month' as 'month' | 'year',
    stripePriceId: '',
    maxCourses: 1,
    maxStudents: 20,
    labAccess: false,
    analytics: false,
    priority: false,
    commissionPercent: 15,
    sortOrder: 0,
  });

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    discountType: 'PERCENT' as 'PERCENT' | 'FIXED',
    discountValue: 10,
    maxUses: 100,
  });

  const plansQuery = useQuery({
    queryKey: ['super-billing-plans'],
    queryFn: () => paymentEndpoints.listAdminPlans(false),
  });

  const couponsQuery = useQuery({
    queryKey: ['super-billing-coupons'],
    queryFn: () => paymentEndpoints.listAdminCoupons(false),
  });

  const createPlanMutation = useMutation({
    mutationFn: () =>
      paymentEndpoints.createAdminPlan({
        name: newPlan.name.toUpperCase(),
        label: newPlan.label,
        description: newPlan.description,
        priceAmount: Number(newPlan.priceAmount),
        currency: newPlan.currency,
        interval: newPlan.interval,
        stripePriceId: newPlan.stripePriceId || null,
        features: {
          maxCourses: Number(newPlan.maxCourses),
          maxStudents: Number(newPlan.maxStudents),
          labAccess: newPlan.labAccess,
          analytics: newPlan.analytics,
          priority: newPlan.priority,
          commissionPercent: Number(newPlan.commissionPercent),
        },
        sortOrder: Number(newPlan.sortOrder),
      }),
    onSuccess: () => {
      toast.success(t('super.billing.toast.planCreated'));
      qc.invalidateQueries({ queryKey: ['super-billing-plans'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error) ?? t('super.billing.toast.planCreateError'));
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        active?: boolean;
        stripePriceId?: string | null;
      };
    }) => paymentEndpoints.updateAdminPlan(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-billing-plans'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error) ?? t('super.billing.toast.planUpdateError'));
    },
  });

  const createCouponMutation = useMutation({
    mutationFn: () =>
      paymentEndpoints.createAdminCoupon({
        code: newCoupon.code.toUpperCase(),
        description: newCoupon.description,
        discountType: newCoupon.discountType,
        discountValue: Number(newCoupon.discountValue),
        maxUses: Number(newCoupon.maxUses),
      }),
    onSuccess: () => {
      toast.success(t('super.billing.toast.couponCreated'));
      qc.invalidateQueries({ queryKey: ['super-billing-coupons'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error) ?? t('super.billing.toast.couponCreateError'));
    },
  });

  const updateCouponMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      paymentEndpoints.updateAdminCoupon(id, { active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-billing-coupons'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error) ?? t('super.billing.toast.couponUpdateError'));
    },
  });

  if (plansQuery.isLoading || couponsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('super.billing.title')}</h1>
        <p className="text-muted-foreground">
          {t('super.billing.subtitle')}
        </p>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Layers className="h-5 w-5" /> {t('super.billing.plans.title')}
        </h2>

        <div className="mb-4 grid gap-2 md:grid-cols-4">
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            <span>{t('super.billing.plans.form.technicalNameLabel')}</span>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm text-foreground"
              placeholder={t('super.billing.plans.form.technicalNamePlaceholder')}
              value={newPlan.name}
              onChange={(e) => setNewPlan((p) => ({ ...p, name: e.target.value }))}
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            <span>{t('super.billing.plans.form.displayLabel')}</span>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm text-foreground"
              placeholder={t('super.billing.plans.form.displayPlaceholder')}
              value={newPlan.label}
              onChange={(e) => setNewPlan((p) => ({ ...p, label: e.target.value }))}
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            <span>{t('super.billing.plans.form.basePriceLabel')}</span>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm text-foreground"
              placeholder={t('super.billing.plans.form.basePricePlaceholder')}
              type="number"
              value={newPlan.priceAmount}
              onChange={(e) => setNewPlan((p) => ({ ...p, priceAmount: Number(e.target.value) }))}
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            <span>{t('super.billing.plans.form.commissionLabel')}</span>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm text-foreground"
              placeholder={t('super.billing.plans.form.commissionPlaceholder')}
              type="number"
              value={newPlan.commissionPercent}
              onChange={(e) => setNewPlan((p) => ({ ...p, commissionPercent: Number(e.target.value) }))}
            />
          </label>
        </div>

        <div className="mb-4 grid gap-2 md:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            <span>{t('super.billing.plans.form.stripePriceIdLabel')}</span>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm text-foreground"
              placeholder={t('super.billing.plans.form.stripePriceIdPlaceholder')}
              value={newPlan.stripePriceId}
              onChange={(e) => setNewPlan((p) => ({ ...p, stripePriceId: e.target.value }))}
            />
          </label>
          <p className="rounded-md border border-muted bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            {t('super.billing.plans.form.stripePriceIdHint')}
          </p>
        </div>

        {newPlan.stripePriceId && (
          <p className="mb-4 inline-flex rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3 py-1 text-xs font-medium text-emerald-700">
            {t('super.billing.plans.form.stripeControlledBadge')}
          </p>
        )}

        <div className="mb-4 grid gap-2 md:grid-cols-3">
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder={t('super.billing.plans.form.maxCoursesPlaceholder')}
            type="number"
            value={newPlan.maxCourses}
            onChange={(e) => setNewPlan((p) => ({ ...p, maxCourses: Number(e.target.value) }))}
          />
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder={t('super.billing.plans.form.maxStudentsPlaceholder')}
            type="number"
            value={newPlan.maxStudents}
            onChange={(e) => setNewPlan((p) => ({ ...p, maxStudents: Number(e.target.value) }))}
          />
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder={t('super.billing.plans.form.sortOrderPlaceholder')}
            type="number"
            value={newPlan.sortOrder}
            onChange={(e) => setNewPlan((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
          />
        </div>

        <textarea
          className="mb-4 w-full rounded-md border px-3 py-2 text-sm"
          placeholder={t('super.billing.plans.form.descriptionPlaceholder')}
          value={newPlan.description}
          onChange={(e) => setNewPlan((p) => ({ ...p, description: e.target.value }))}
        />

        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={newPlan.labAccess}
              onChange={(e) => setNewPlan((p) => ({ ...p, labAccess: e.target.checked }))}
            />
            {t('super.billing.plans.form.labAccess')}
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={newPlan.analytics}
              onChange={(e) => setNewPlan((p) => ({ ...p, analytics: e.target.checked }))}
            />
            {t('super.billing.plans.form.analytics')}
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={newPlan.priority}
              onChange={(e) => setNewPlan((p) => ({ ...p, priority: e.target.checked }))}
            />
            {t('super.billing.plans.form.priority')}
          </label>
        </div>

        <button
          onClick={() => createPlanMutation.mutate()}
          disabled={!newPlan.name || !newPlan.label || createPlanMutation.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> {t('super.billing.plans.actions.create')}
        </button>

        <div className="mt-5 space-y-2">
          {plansQuery.data?.map((plan) => (
            <div key={plan.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{plan.label} ({plan.name})</p>
                <p className="text-xs text-muted-foreground">
                  {t('super.billing.plans.list.summary', {
                    amount: plan.priceAmount,
                    interval: t(`super.billing.interval.${plan.interval}`),
                    commission: plan.features.commissionPercent,
                    courses: plan.features.maxCourses,
                    students: plan.features.maxStudents,
                  })}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    className="w-full max-w-xs rounded-md border px-2 py-1 text-xs"
                    placeholder={t('super.billing.plans.list.stripePriceIdPlaceholder')}
                    value={
                      stripePriceDrafts[plan.id] ?? plan.stripePriceId ?? ''
                    }
                    onChange={(e) =>
                      setStripePriceDrafts((curr) => ({
                        ...curr,
                        [plan.id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    onClick={() =>
                      updatePlanMutation.mutate({
                        id: plan.id,
                        data: {
                          stripePriceId:
                            (stripePriceDrafts[plan.id] ?? plan.stripePriceId ?? '') ||
                            null,
                        },
                      })
                    }
                    className="rounded-md border px-2 py-1 text-xs font-medium hover:bg-accent"
                  >
                    {t('super.billing.plans.list.saveStripeId')}
                  </button>
                  {(stripePriceDrafts[plan.id] ?? plan.stripePriceId) && (
                    <span className="rounded-full border border-emerald-600/20 bg-emerald-600/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      {t('super.billing.plans.form.stripeControlledBadge')}
                    </span>
                  )}
                </div>
                {plan.priceAmount > 0 && !plan.stripePriceId && (
                  <p className="mt-2 text-xs text-amber-700">
                    {t('super.billing.plans.list.missingStripeWarning')}
                  </p>
                )}
              </div>
              <div className="ml-3 shrink-0">
                <button
                  onClick={() =>
                    updatePlanMutation.mutate({
                      id: plan.id,
                      data: { active: !plan.active },
                    })
                  }
                  className={`rounded-md px-3 py-1 text-xs font-medium ${plan.active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}
                >
                  {plan.active ? t('super.billing.plans.list.activeToggle') : t('super.billing.plans.list.inactiveToggle')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Ticket className="h-5 w-5" /> {t('super.billing.coupons.title')}
        </h2>

        <div className="mb-4 grid gap-2 md:grid-cols-4">
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder={t('super.billing.coupons.form.codePlaceholder')}
            value={newCoupon.code}
            onChange={(e) => setNewCoupon((c) => ({ ...c, code: e.target.value }))}
          />
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={newCoupon.discountType}
            onChange={(e) =>
              setNewCoupon((c) => ({ ...c, discountType: e.target.value as 'PERCENT' | 'FIXED' }))
            }
          >
            <option value="PERCENT">{t('super.billing.coupons.form.discountTypePercent')}</option>
            <option value="FIXED">{t('super.billing.coupons.form.discountTypeFixed')}</option>
          </select>
          <input
            className="rounded-md border px-3 py-2 text-sm"
            type="number"
            placeholder={t('super.billing.coupons.form.discountValuePlaceholder')}
            value={newCoupon.discountValue}
            onChange={(e) => setNewCoupon((c) => ({ ...c, discountValue: Number(e.target.value) }))}
          />
          <input
            className="rounded-md border px-3 py-2 text-sm"
            type="number"
            placeholder={t('super.billing.coupons.form.maxUsesPlaceholder')}
            value={newCoupon.maxUses}
            onChange={(e) => setNewCoupon((c) => ({ ...c, maxUses: Number(e.target.value) }))}
          />
        </div>

        <input
          className="mb-4 w-full rounded-md border px-3 py-2 text-sm"
          placeholder={t('super.billing.coupons.form.descriptionPlaceholder')}
          value={newCoupon.description}
          onChange={(e) => setNewCoupon((c) => ({ ...c, description: e.target.value }))}
        />

        <button
          onClick={() => createCouponMutation.mutate()}
          disabled={!newCoupon.code || createCouponMutation.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> {t('super.billing.coupons.actions.create')}
        </button>

        <div className="mt-5 space-y-2">
          {couponsQuery.data?.map((coupon) => (
            <div key={coupon.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div>
                <p className="font-medium">{coupon.code}</p>
                <p className="text-xs text-muted-foreground">
                  {t('super.billing.coupons.list.summary', {
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue,
                    usedCount: coupon.usedCount,
                    maxUses: coupon.maxUses ?? t('super.billing.coupons.list.unlimited'),
                  })}
                </p>
              </div>
              <button
                onClick={() => updateCouponMutation.mutate({ id: coupon.id, active: !coupon.active })}
                className={`rounded-md px-3 py-1 text-xs font-medium ${coupon.active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}
              >
                {coupon.active ? t('super.billing.coupons.list.activeToggle') : t('super.billing.coupons.list.inactiveToggle')}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
