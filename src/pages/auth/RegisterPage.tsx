import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authEndpoints } from '@/services/endpoints/auth.endpoints';
import { useAuthStore } from '@/features/auth/auth.store';
import { useTranslation } from 'react-i18next';

type FormData = {
  name: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const slug = tenantSlug ?? '';
  const base = tenantSlug ? `/t/${tenantSlug}` : '';

  const schema = z.object({
    name: z.string().min(2, t('common.validation.nameMinLength')),
    email: z.string().email(t('common.validation.emailInvalid')),
    password: z
      .string()
      .min(8, t('common.validation.passwordMinLength'))
      .regex(/[A-Z]/, t('common.validation.passwordUppercase'))
      .regex(/[0-9]/, t('common.validation.passwordNumber'))
  });

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authEndpoints.register(slug, data);
      setAuth(res.user, res.token, res.refreshToken, slug);
      toast.success(t('auth.register.toast.success'));
      navigate(`${base}/app/dashboard`, { replace: true });
    } catch {
      toast.error(t('auth.register.toast.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-2 text-3xl font-extrabold">{t('auth.register.title')}</h1>
      <p className="mb-8 text-muted-foreground">
        {t('auth.register.hasAccount')}{' '}
        <Link
          to={`${base}/login`}
          className="font-medium text-primary hover:underline"
        >
          {t('common.actions.login')}
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="name">
            {t('common.fields.fullName')}
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder={t('common.placeholders.name')}
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
            {...register('name')}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
            {t('common.fields.email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t('common.placeholders.email')}
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            htmlFor="password"
          >
            {t('common.fields.password')}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={t('common.placeholders.passwordMin')}
              className="w-full rounded-lg border bg-background px-4 py-2.5 pr-10 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
              {...register('password')}
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
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('common.actions.register')}
        </button>
      </form>
    </div>
  );
}
