import { Link, Outlet, useParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';

/**
 * Layout de autenticação com branding do tenant (/t/:tenantSlug/login, /register)
 */
export function TenantAuthLayout() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();

  const base = `/t/${tenantSlug}`;

  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-primary p-12 text-primary-foreground">
        <Link to={base} className="mb-12 flex items-center gap-3">
          {tenant?.logoUrl ? (
            <img src={tenant.logoUrl} alt="" className="h-10 w-10 rounded" />
          ) : (
            <BookOpen className="h-10 w-10" />
          )}
          <span className="text-3xl font-bold">
            {tenant?.name ?? 'Trivestia'}
          </span>
        </Link>
        {tenant?.bio ? (
          <p className="max-w-sm text-center text-xl font-light leading-relaxed opacity-90">
            {tenant.bio}
          </p>
        ) : (
          <blockquote className="max-w-sm text-center text-xl font-light leading-relaxed opacity-90">
            "O investimento em conhecimento sempre paga os melhores dividendos."
            <footer className="mt-4 text-sm opacity-70">
              — Benjamin Franklin
            </footer>
          </blockquote>
        )}
      </div>

      {/* Painel direito — form */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
        <Link to={base} className="mb-8 flex items-center gap-2 lg:hidden">
          {tenant?.logoUrl ? (
            <img src={tenant.logoUrl} alt="" className="h-7 w-7 rounded" />
          ) : (
            <BookOpen className="h-7 w-7 text-primary" />
          )}
          <span className="text-2xl font-bold">
            {tenant?.name ?? 'Trivestia'}
          </span>
        </Link>
        <Outlet />
      </div>
    </div>
  );
}
