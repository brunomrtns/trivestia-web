import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, School, ExternalLink } from 'lucide-react';
import { usePlatformAuthStore } from '@/features/platform/platform.store';
import { useAuthStore } from '@/features/auth/auth.store';
import { platformEndpoints } from '@/services/endpoints/platform.endpoints';
import type { PlatformMeResponse } from '@/types/api';

export default function WorkspacePage() {
  const { user } = usePlatformAuthStore();
  const { t } = useTranslation();
  const tenantSetAuth = useAuthStore((s) => s.setAuth);
  const tenantIsAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [meData, setMeData] = useState<PlatformMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    platformEndpoints
      .me()
      .then(async (me) => {
        setMeData(me);
        // Se o professor tem escola mas ainda nao tem sessao de tenant,
        // obtemos o token automaticamente sem pedir senha de novo.
        if (me.hasSchool && me.tenantSlug && !tenantIsAuthenticated) {
          try {
            const session = await platformEndpoints.autoTenantSession();
            tenantSetAuth(
              session.user,
              session.token,
              session.refreshToken,
              session.tenantSlug
            );
          } catch {
            // Nao bloquear a pagina se falhar — usuario ainda pode navegar para /admin
          }
        }
      })
      .catch(() => toast.error(t('workspace.page.toast.loadError')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Professor ja tem escola — mostra painel com link para o admin
  if (meData?.hasSchool && meData.tenantSlug) {
    return (
      <div className="container max-w-2xl py-16">
        <h1 className="mb-2 text-3xl font-extrabold">
          {t('workspace.page.welcome', { name: user?.name })}
        </h1>
        <p className="mb-8 text-muted-foreground">
          {t('workspace.page.subtitle')}
        </p>

        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <School className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-1 text-xl font-bold">{meData.tenantName}</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            trivestia.com/t/{meData.tenantSlug}
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href={`/t/${meData.tenantSlug}/admin/courses`}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
            >
              {t('workspace.page.manageButton')}
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href={`/t/${meData.tenantSlug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition hover:bg-accent"
            >
              {t('workspace.page.viewAsStudent')}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Professor ainda nao tem escola — redireciona para criacao
  return <Navigate to="/workspace/create-school" replace />;
}
