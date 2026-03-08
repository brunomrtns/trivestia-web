import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, BookOpen, Check, X } from 'lucide-react';
import { tenantEndpoints } from '@/services/endpoints/tenant.endpoints';
import { useAuthStore } from '@/features/auth/auth.store';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';

// ─── Schema (definido dentro do componente para usar t()) ──────────────────────────────────

type FormData = {
  name: string;
  slug: string;
  bio?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
};

export default function CreateSchoolPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const schema = z.object({
    name: z.string().min(2, t('common.validation.nameMinLength')),
    slug: z
      .string()
      .min(3, t('common.validation.slugMinLength'))
      .max(40, t('common.validation.slugMaxLength'))
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, t('common.validation.slugPattern')),
    bio: z.string().max(300, t('common.validation.bioMaxLength')).optional(),
    ownerName: z.string().min(2, t('common.validation.nameMinLength')),
    ownerEmail: z.string().email(t('common.validation.emailInvalid')),
    ownerPassword: z
      .string()
      .min(8, t('common.validation.passwordMinLength'))
      .regex(/[A-Z]/, t('common.validation.passwordUppercase'))
      .regex(/[0-9]/, t('common.validation.passwordNumber'))
  });

  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slugStatus, setSlugStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Auto-gerar slug a partir do nome
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

  // Verificar disponibilidade do slug com debounce
  const checkSlugAvailability = useDebouncedCallback(async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugStatus('idle');
      return;
    }
    setSlugStatus('checking');
    try {
      const { available } = await tenantEndpoints.checkSlug(slug);
      setSlugStatus(available ? 'available' : 'taken');
    } catch {
      setSlugStatus('idle');
    }
  }, 500);

  const onSubmit = async (data: FormData) => {
    if (slugStatus === 'taken') {
      toast.error(t('public.createSchool.toast.slugTaken'));
      return;
    }
    setLoading(true);
    try {
      const res = await tenantEndpoints.createPublic(data);
      setAuth(res.user, res.token, res.refreshToken, res.tenant.slug);
      toast.success(
        t('public.createSchool.toast.success', { name: res.tenant.name })
      );
      navigate(`/t/${res.tenant.slug}/app/dashboard`, { replace: true });
    } catch {
      toast.error(t('public.createSchool.toast.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary" />
          <span className="text-2xl font-bold">Trivestia</span>
        </Link>

        <h1 className="mb-2 text-3xl font-extrabold">
          {t('public.createSchool.title')}
        </h1>
        <p className="mb-8 text-muted-foreground">
          {t('public.createSchool.subtitle')}
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* School Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="name">
              {t('public.createSchool.form.schoolName')}
            </label>
            <input
              id="name"
              type="text"
              placeholder={t('public.createSchool.form.schoolNamePlaceholder')}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
              {...register('name', {
                onChange: (e) => {
                  const slug = autoSlug(e.target.value);
                  checkSlugAvailability(slug);
                }
              })}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="slug">
              {t('public.createSchool.form.schoolUrl')}
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">/t/</span>
              <div className="relative flex-1">
                <input
                  id="slug"
                  type="text"
                  placeholder={t('public.createSchool.form.slugPlaceholder')}
                  className="w-full rounded-lg border bg-background px-4 py-2.5 pr-10 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  {...register('slug', {
                    onChange: (e) => checkSlugAvailability(e.target.value)
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
            {slugStatus === 'taken' && (
              <p className="mt-1 text-xs text-destructive">
                {t('public.createSchool.form.slugTaken')}
              </p>
            )}
            {errors.slug && (
              <p className="mt-1 text-xs text-destructive">
                {errors.slug.message}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="bio">
              {t('public.createSchool.form.description')}{' '}
              <span className="text-muted-foreground">
                {t('common.misc.optional')}
              </span>
            </label>
            <textarea
              id="bio"
              placeholder={t('public.createSchool.form.bioPlaceholder')}
              rows={2}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
              {...register('bio')}
            />
            {errors.bio && (
              <p className="mt-1 text-xs text-destructive">
                {errors.bio.message}
              </p>
            )}
          </div>

          <hr className="my-2" />
          <p className="text-sm font-medium text-muted-foreground">
            {t('public.createSchool.form.ownerSection')}
          </p>

          {/* Owner name */}
          <div>
            <label
              className="mb-1.5 block text-sm font-medium"
              htmlFor="ownerName"
            >
              {t('public.createSchool.form.ownerName')}
            </label>
            <input
              id="ownerName"
              type="text"
              autoComplete="name"
              placeholder={t('public.createSchool.form.ownerNamePlaceholder')}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
              {...register('ownerName')}
            />
            {errors.ownerName && (
              <p className="mt-1 text-xs text-destructive">
                {errors.ownerName.message}
              </p>
            )}
          </div>

          {/* Owner email */}
          <div>
            <label
              className="mb-1.5 block text-sm font-medium"
              htmlFor="ownerEmail"
            >
              {t('common.fields.email')}
            </label>
            <input
              id="ownerEmail"
              type="email"
              autoComplete="email"
              placeholder={t('common.placeholders.email')}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
              {...register('ownerEmail')}
            />
            {errors.ownerEmail && (
              <p className="mt-1 text-xs text-destructive">
                {errors.ownerEmail.message}
              </p>
            )}
          </div>

          {/* Owner password */}
          <div>
            <label
              className="mb-1.5 block text-sm font-medium"
              htmlFor="ownerPassword"
            >
              {t('common.fields.password')}
            </label>
            <div className="relative">
              <input
                id="ownerPassword"
                type={showPwd ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={t('common.placeholders.passwordMin')}
                className="w-full rounded-lg border bg-background px-4 py-2.5 pr-10 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...register('ownerPassword')}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPwd ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.ownerPassword && (
              <p className="mt-1 text-xs text-destructive">
                {errors.ownerPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || slugStatus === 'taken'}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('public.createSchool.form.submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('public.createSchool.hasAccount')}{' '}
          <Link to="/" className="font-medium text-primary hover:underline">
            {t('common.actions.access')}
          </Link>
        </p>
      </div>
    </div>
  );
}
