import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Plus, Tag } from 'lucide-react';
import { paymentEndpoints } from '@/services/endpoints/payment.endpoints';
import type { Offer, OfferType, BillingInterval } from '@/types/api';

type FormData = {
  title: string;
  description?: string;
  type: OfferType;
  priceAmount?: number;
  priceCurrency?: string;
  billingInterval?: BillingInterval;
  courseId?: string;
};

export default function AdminOffersPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { t } = useTranslation();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const schema = z.object({
    title: z.string().min(2, t('admin.offers.validation.titleMin')),
    description: z.string().max(1000).optional(),
    type: z.enum(['FREE', 'ONE_TIME', 'SUBSCRIPTION']),
    priceAmount: z.number().positive().optional(),
    priceCurrency: z
      .string()
      .length(3)
      .optional(),
    billingInterval: z.enum(['MONTH', 'YEAR']).optional(),
    courseId: z.string().optional(),
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedType = watch('type');

  useEffect(() => {
    if (tenantSlug) loadOffers();
  }, [tenantSlug]);

  async function loadOffers() {
    if (!tenantSlug) return;
    setLoading(true);
    try {
      const data = await paymentEndpoints.listOffers(tenantSlug, true);
      setOffers(data);
    } catch {
      toast.error(t('admin.offers.toast.loadError'));
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: FormData) {
    if (!tenantSlug) return;
    setCreating(true);
    try {
      await paymentEndpoints.createOffer(tenantSlug, {
        ...data,
        priceAmount:
          data.type === 'FREE' ? undefined : data.priceAmount,
        priceCurrency:
          data.type === 'FREE' ? undefined : data.priceCurrency,
        billingInterval:
          data.type === 'SUBSCRIPTION'
            ? data.billingInterval
            : undefined,
      });
      toast.success(t('admin.offers.toast.created'));
      setShowForm(false);
      reset();
      loadOffers();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? t('admin.offers.toast.createError')
      );
    } finally {
      setCreating(false);
    }
  }

  async function toggleOffer(offer: Offer) {
    if (!tenantSlug) return;
    try {
      await paymentEndpoints.updateOffer(tenantSlug, offer.id, {
        active: !offer.active,
      });
      loadOffers();
    } catch {
      toast.error(t('admin.offers.toast.updateError'));
    }
  }

  function formatPrice(amount: number | null, currency: string | null) {
    if (!amount || !currency) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.offers.page.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('admin.offers.page.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          {t('admin.offers.page.newButton')}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-lg border bg-card p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1.5 block text-sm font-medium">
                {t('admin.offers.form.title')}
              </label>
              <input
                type="text"
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...register('title')}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <label className="mb-1.5 block text-sm font-medium">
                {t('admin.offers.form.descriptionOptional')}
              </label>
              <textarea
                rows={2}
                className="w-full resize-none rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...register('description')}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {t('admin.offers.form.type')}
              </label>
              <select
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...register('type')}
              >
                <option value="FREE">{t('admin.offers.type.free')}</option>
                <option value="ONE_TIME">{t('admin.offers.type.oneTimePayment')}</option>
                <option value="SUBSCRIPTION">{t('admin.offers.type.subscription')}</option>
              </select>
            </div>

            {selectedType !== 'FREE' && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    {t('admin.offers.form.priceAmountCents')}
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    {...register('priceAmount', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    {t('admin.offers.form.currency')}
                  </label>
                  <select
                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    {...register('priceCurrency')}
                  >
                    <option value="usd">USD</option>
                    <option value="brl">BRL</option>
                    <option value="eur">EUR</option>
                  </select>
                </div>
              </>
            )}

            {selectedType === 'SUBSCRIPTION' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t('admin.offers.form.billingInterval')}
                </label>
                <select
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  {...register('billingInterval')}
                >
                  <option value="MONTH">{t('admin.offers.interval.monthly')}</option>
                  <option value="YEAR">{t('admin.offers.interval.yearly')}</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-60"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('admin.offers.actions.create')}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                reset();
              }}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-accent"
            >
              {t('common.actions.cancel')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Tag className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">{t('admin.offers.empty.title')}</p>
          <p className="text-sm text-muted-foreground">
            {t('admin.offers.empty.subtitle')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{offer.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      offer.type === 'FREE'
                        ? 'bg-green-100 text-green-700'
                        : offer.type === 'ONE_TIME'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {offer.type === 'FREE'
                      ? t('admin.offers.type.free')
                      : offer.type === 'ONE_TIME'
                        ? t('admin.offers.type.oneTime')
                        : t('admin.offers.type.subscriptionWithInterval', { interval: offer.billingInterval?.toLowerCase() })}
                  </span>
                  {!offer.active && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      {t('admin.offers.status.inactive')}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {offer.description ?? t('admin.offers.noDescription')} &middot;{' '}
                  {formatPrice(offer.priceAmount, offer.priceCurrency)}
                </p>
              </div>
              <button
                onClick={() => toggleOffer(offer)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  offer.active
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                    : 'bg-green-500/10 text-green-700 hover:bg-green-500/20'
                }`}
              >
                {offer.active ? t('admin.offers.actions.deactivate') : t('admin.offers.actions.activate')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
