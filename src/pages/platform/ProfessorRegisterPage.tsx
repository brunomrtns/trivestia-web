import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import { platformEndpoints } from '@/services/endpoints/platform.endpoints';
import { usePlatformAuthStore } from '@/features/platform/platform.store';

// ─── Schema (definido dentro do componente para usar t()) ──────────────────────────────────

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ProfessorRegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const schema = z
    .object({
      name: z.string().min(2, t('common.validation.nameMinLength')),
      email: z.string().email(t('common.validation.emailInvalid')),
      password: z
        .string()
        .min(8, t('common.validation.passwordMinLength'))
        .regex(/[A-Z]/, t('common.validation.passwordUppercase'))
        .regex(/[0-9]/, t('common.validation.passwordNumber')),
      confirmPassword: z.string()
    })
    .refine((d) => d.password === d.confirmPassword, {
      path: ['confirmPassword'],
      message: t('common.validation.passwordMatch')
    });

  const setAuth = usePlatformAuthStore((s) => s.setAuth);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await platformEndpoints.register({
        name: data.name,
        email: data.email,
        password: data.password
      });
      setAuth(res.user, res.token, res.refreshToken);
      toast.success(t('platform.professorRegister.toast.success'));
      navigate('/workspace', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg ?? t('platform.professorRegister.toast.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary" />
          <span className="text-2xl font-bold">Trivestia</span>
        </Link>

        <h1 className="mb-2 text-3xl font-extrabold">
          {t('platform.professorRegister.title')}
        </h1>
        <p className="mb-8 text-muted-foreground">
          {t('platform.professorRegister.subtitle')}
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="name">
              {t('common.fields.fullName')}
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              autoFocus
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

          <div>
            <label
              className="mb-1.5 block text-sm font-medium"
              htmlFor="confirmPassword"
            >
              {t('common.fields.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={t('common.placeholders.repeatPassword')}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('platform.professorRegister.submitButton')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('platform.professorRegister.hasAccount')}{' '}
          <Link
            to="/login"
            className="font-medium text-primary hover:underline"
          >
            {t('common.actions.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
