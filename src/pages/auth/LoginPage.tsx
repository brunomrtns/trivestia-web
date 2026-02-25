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

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória')
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [searchParams] = useSearchParams();
  const defaultReturn = tenantSlug
    ? `/t/${tenantSlug}/app/dashboard`
    : '/app/dashboard';
  const returnTo = searchParams.get('returnTo') ?? defaultReturn;
  const { isAuthenticated, isLoading, setAuth } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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
      toast.success(`Bem-vindo, ${res.user.name}!`);
      navigate(returnTo, { replace: true });
    } catch {
      toast.error('E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-2 text-3xl font-extrabold">Entrar</h1>
      <p className="mb-8 text-muted-foreground">
        Novo por aqui?{' '}
        <Link
          to={`${base}/register`}
          className="font-medium text-primary hover:underline"
        >
          Criar conta
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@email.com"
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
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
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
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
          Entrar
        </button>
      </form>
    </div>
  );
}
