import { Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import { useTenant } from '@/hooks/useTenant';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';

/**
 * LoginPage — BI Identity SSO.
 *
 * Login is now handled centrally by the BI Identity Service at /id/login.
 * This page either redirects authenticated users to the dashboard, or
 * unauthenticated users to the Identity Service login page.
 */
export default function LoginPage() {
  const { t } = useTranslation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { tenant } = useTenant();

  const slug = tenantSlug ?? '';
  const displaySchoolName = tenant?.name ?? '';

  // Redirect to BI Identity login for unauthenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/id/login?redirect=/trivestia/';
    }
  }, [isLoading, isAuthenticated]);

  // Já autenticado — sai da tela de login para evitar loops
  if (!isLoading && isAuthenticated) {
    return <Navigate to={`/t/${slug}/app/dashboard`} replace />;
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center justify-center">
      {/* Nome da escola — visível especialmente no mobile */}
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
      <div className="flex flex-col items-center gap-4 py-12">
        <BookOpen className="h-10 w-10 text-primary" />
        <h1 className="text-2xl font-extrabold">
          {t('auth.login.title')}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.login.redirectToBi', {
            defaultValue:
              'Redirecionando para o login do Brunointegrations…'
          })}
        </p>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
