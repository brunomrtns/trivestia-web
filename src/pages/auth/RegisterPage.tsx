import { Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';

/**
 * RegisterPage — BI Identity SSO.
 *
 * Registration is now handled centrally by the BI Identity Service at /id/login.
 * This page redirects unauthenticated users to the Identity Service.
 */
export default function RegisterPage() {
  const { t } = useTranslation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { isAuthenticated, isLoading } = useAuthStore();

  const slug = tenantSlug ?? '';

  // Redirect to BI Identity login for unauthenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/id/login?redirect=/trivestia/';
    }
  }, [isLoading, isAuthenticated]);

  // Já autenticado — sai da tela para evitar loops
  if (!isLoading && isAuthenticated) {
    return <Navigate to={`/t/${slug}/app/dashboard`} replace />;
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4 py-12">
        <BookOpen className="h-10 w-10 text-primary" />
        <h1 className="text-2xl font-extrabold">
          {t('auth.register.title')}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.register.redirectToBi', {
            defaultValue:
              'Redirecionando para o login do Brunointegrations…'
          })}
        </p>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
