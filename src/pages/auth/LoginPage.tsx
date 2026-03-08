import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Link,
  Navigate,
  useNavigate,
  useSearchParams,
  useParams
} from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authEndpoints } from '@/services/endpoints/auth.endpoints';
import { useAuthStore } from '@/features/auth/auth.store';
import { useTenant } from '@/hooks/useTenant';
import { useTranslation } from 'react-i18next';

type FormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [searchParams] = useSearchParams();
  const defaultReturn = tenantSlug
    ? `/t/${tenantSlug}/app/dashboard`
    : '/app/dashboard';
  const returnTo = searchParams.get('returnTo') ?? defaultReturn;
  const { isAuthenticated, isLoading, setAuth } = useAuthStore();
  const { tenant } = useTenant();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // E-mail e nome da escola podem vir pré-preenchidos via query param
  // quando o usuário passa pelo GlobalLoginPage
  const prefilledEmail = searchParams.get('email') ?? '';
  const schoolNameParam = searchParams.get('school') ?? '';

  // Nome da escola: query param (instantâneo) ou useTenant (fallback para acesso direto)
  const displaySchoolName = schoolNameParam || tenant?.name || '';

  const schema = z.object({
    email: z.string().email(t('common.validation.emailInvalid')),
    password: z.string().min(1, t('common.validation.passwordRequired'))
  });

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: prefilledEmail, password: '' }
  });

  const slug = tenantSlug ?? '';
  const base = tenantSlug ? `/t/${tenantSlug}` : '';

  // Todos os hooks acima. S\u00f3 agora e permitido retornar condicionalmente.
  // Ja autenticado \u2014 sai da tela de login para evitar loops
  if (!isLoading && isAuthenticated) {
    return <Navigate to={`/t/${slug}/app/dashboard`} replace />;
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authEndpoints.login(slug, data);
      setAuth(res.user, res.token, res.refreshToken, slug);
      toast.success(t('auth.login.toast.success', { name: res.user.name }));
      navigate(returnTo, { replace: true });
    } catch {
      toast.error(t('auth.login.toast.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Nome da escola — visível especialmente no mobile onde o painel lateral não aparece */}
      {displaySchoolName && (
        <div className="mb-4 flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary w-fit">
          {tenant?.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt=""
              className="h-3.5 w-3.5 rounded-full"
            />
          ) : (
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          )}
          {displaySchoolName}
        </div>
      )}
      <h1 className="mb-2 text-3xl font-extrabold">{t('auth.login.title')}</h1>
      <p className="mb-8 text-muted-foreground">
        {t('auth.login.newHere')}{' '}
        <Link
          to={`${base}/register`}
          className="font-medium text-primary hover:underline"
        >
          {t('common.actions.register')}
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
            {t('common.fields.email')}
          </label>
          {prefilledEmail ? (
            // E-mail pré-preenchido pelo GlobalLoginPage — exibe bloqueado
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2.5 text-sm">
              <span>{prefilledEmail}</span>
              <a
                href="/login"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                {t('auth.login.changeEmail')}
              </a>
            </div>
          ) : (
            <>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t('common.placeholders.email')}
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </>
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
              autoComplete="current-password"
              autoFocus={!!prefilledEmail}
              placeholder="••••••••"
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
          {t('common.actions.login')}
        </button>
      </form>
    </div>
  );
}
