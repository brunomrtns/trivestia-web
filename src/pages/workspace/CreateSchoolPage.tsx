import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Check, Loader2, X } from 'lucide-react';
import { usePlatformAuthStore } from '@/features/platform/platform.store';
import { platformStorage } from '@/features/platform/platformStorage';
import { platformEndpoints } from '@/services/endpoints/platform.endpoints';
import { paymentEndpoints } from '@/services/endpoints/payment.endpoints';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';

// ─── Types ───────────────────────────────────────────────────────────────────

type FormData = { name: string; slug: string; bio?: string };

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CreateSchoolPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, token, isAuthenticated, isLoading, setAuth } =
    usePlatformAuthStore();
  const [creating, setCreating] = useState(false);
  const [slugStatus, setSlugStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');

  const schema = z.object({
    name: z.string().min(2, t('common.validation.nameMinLength')),
    slug: z
      .string()
      .min(3, t('common.validation.slugMinLength'))
      .max(40, t('common.validation.slugMaxLength'))
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, t('common.validation.slugPattern')),
    bio: z.string().max(300, t('common.validation.bioMaxLength')).optional()
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Guard de autenticacao — defesa em profundidade alem do PlatformGuard da rota
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const autoSlug = useCallback(
    (name: string) => {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setValue('slug', slug, { shouldValidate: true });
      return slug;
    },
    [setValue]
  );

  const checkSlug = useDebouncedCallback(async (slug: string) => {
    if (slug.length < 3) {
      setSlugStatus('idle');
      return;
    }
    setSlugStatus('checking');
    try {
      // Placeholder: substituir por endpoint dedicado de check-slug quando disponivel
      void slug;
      setSlugStatus('idle');
    } catch {
      setSlugStatus('idle');
    }
  }, 400);

  const onSubmit = async (data: FormData) => {
    setCreating(true);
    try {
      const result = await paymentEndpoints.createSchoolCheckoutClaim(data);
      window.location.href = result.checkoutUrl;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg ?? t('workspace.createSchool.toast.error'));
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-16">
      <h1 className="mb-2 text-3xl font-extrabold">
        {t('workspace.createSchool.title')}
      </h1>
      <p className="mb-8 text-muted-foreground">
        {t('workspace.createSchool.subtitle')}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="name">
            {t('workspace.createSchool.form.nameLabel')}
          </label>
          <input
            id="name"
            type="text"
            autoFocus
            placeholder={t('workspace.createSchool.form.namePlaceholder')}
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
            {...register('name', {
              onChange: (e) => {
                const s = autoSlug(e.target.value as string);
                checkSlug(s);
              }
            })}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="slug">
            {t('workspace.createSchool.form.slugLabel')}
          </label>
          <div className="flex items-center gap-1">
            <span className="shrink-0 text-sm text-muted-foreground">/t/</span>
            <div className="relative flex-1">
              <input
                id="slug"
                type="text"
                placeholder={t('workspace.createSchool.form.slugPlaceholder')}
                className="w-full rounded-lg border bg-background px-4 py-2.5 pr-10 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...register('slug', {
                  onChange: (e) => checkSlug(e.target.value as string)
                })}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {slugStatus === 'checking' && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {slugStatus === 'available' && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                {slugStatus === 'taken' && (
                  <X className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
          </div>
          {errors.slug && (
            <p className="mt-1 text-xs text-destructive">
              {errors.slug.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="bio">
            {t('workspace.createSchool.form.descriptionLabel')}{' '}
            <span className="text-muted-foreground">
              {t('common.misc.optional')}
            </span>
          </label>
          <textarea
            id="bio"
            rows={2}
            placeholder={t(
              'workspace.createSchool.form.descriptionPlaceholder'
            )}
            className="w-full resize-none rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
            {...register('bio')}
          />
          {errors.bio && (
            <p className="mt-1 text-xs text-destructive">
              {errors.bio.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={creating || slugStatus === 'taken'}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-60"
        >
          {creating && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('workspace.createSchool.form.submitButton')}
        </button>
      </form>
    </div>
  );
}
