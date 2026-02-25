import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import { platformEndpoints } from '@/services/endpoints/platform.endpoints';
import { authEndpoints } from '@/services/endpoints/auth.endpoints';
import { usePlatformAuthStore } from '@/features/platform/platform.store';
import { useAuthStore } from '@/features/auth/auth.store';
import type { ResolveEmailResponse } from '@/types/api';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email('E-mail inválido')
});

const passwordSchema = z.object({
  password: z.string().min(1, 'Senha obrigatória')
});

type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ─── Tipos internos ───────────────────────────────────────────────────────────

type Phase = 'EMAIL' | 'CHOICE' | 'PASSWORD';

type LoginContext =
  | { type: 'platform' }
  | { type: 'tenant'; slug: string; name: string };

// ─── Componente ───────────────────────────────────────────────────────────────

export default function GlobalLoginPage() {
  const navigate = useNavigate();
  const platformSetAuth = usePlatformAuthStore((s) => s.setAuth);
  const tenantSetAuth = useAuthStore((s) => s.setAuth);

  const [phase, setPhase] = useState<Phase>('EMAIL');
  const [resolveResult, setResolveResult] =
    useState<ResolveEmailResponse | null>(null);
  const [loginCtx, setLoginCtx] = useState<LoginContext | null>(null);
  const [resolving, setResolving] = useState(false);
  const [logging, setLogging] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState('');
  const [schoolSlug, setSchoolSlug] = useState('');

  const {
    register: regEmail,
    handleSubmit: handleEmail,
    formState: { errors: emailErrors }
  } = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });

  const {
    register: regPwd,
    handleSubmit: handlePwd,
    formState: { errors: pwdErrors }
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  // ─── Passo 1: resolver e-mail ──────────────────────────────────────────────

  const onResolve = async (data: EmailForm) => {
    setResolving(true);
    try {
      const resolved = await platformEndpoints.resolve(data.email);
      setEmail(data.email);
      setResolveResult(resolved);

      const { platformAccount, tenants } = resolved;

      if (!platformAccount && tenants.length === 0) {
        // Nenhuma conta — CHOICE mostra opcoes de cadastro
        setPhase('CHOICE');
        return;
      }

      if (platformAccount && tenants.length === 0) {
        // Somente professor — pula direto para senha
        setLoginCtx({ type: 'platform' });
        setPhase('PASSWORD');
        return;
      }

      if (!platformAccount && tenants.length === 1) {
        // Somente aluno em uma escola — pula direto para senha
        setLoginCtx({
          type: 'tenant',
          slug: tenants[0].slug,
          name: tenants[0].name
        });
        setPhase('PASSWORD');
        return;
      }

      // Multiplas opcoes (N tenants ou plataforma + tenants) — mostra CHOICE
      setPhase('CHOICE');
    } catch {
      toast.error('Erro ao verificar e-mail. Tente novamente.');
    } finally {
      setResolving(false);
    }
  };

  // ─── Selecionar contexto no CHOICE e ir para senha ────────────────────────

  const selectCtx = (ctx: LoginContext) => {
    setLoginCtx(ctx);
    setPhase('PASSWORD');
  };

  // ─── Passo final: senha + login ────────────────────────────────────────────

  const onLogin = async (data: PasswordForm) => {
    if (!loginCtx) return;
    setLogging(true);
    try {
      if (loginCtx.type === 'platform') {
        const res = await platformEndpoints.login({
          email,
          password: data.password
        });
        platformSetAuth(res.user, res.token, res.refreshToken);
        toast.success(`Bem-vindo, ${res.user.name}!`);
        navigate('/workspace', { replace: true });
      } else {
        const res = await authEndpoints.login(loginCtx.slug, {
          email,
          password: data.password
        });
        tenantSetAuth(res.user, res.token, res.refreshToken, loginCtx.slug);
        toast.success(`Bem-vindo, ${res.user.name}!`);
        navigate(`/t/${loginCtx.slug}/app/dashboard`, { replace: true });
      }
    } catch {
      toast.error(
        loginCtx.type === 'tenant'
          ? 'Conta nao existe nesta escola ou senha incorreta.'
          : 'Credenciais invalidas.'
      );
    } finally {
      setLogging(false);
    }
  };

  // ─── Resetar para o inicio ────────────────────────────────────────────────

  const reset = () => {
    setPhase('EMAIL');
    setLoginCtx(null);
    setResolveResult(null);
    setSchoolSlug('');
  };

  // ─── Voltar do PASSWORD para CHOICE ou EMAIL ──────────────────────────────

  const backFromPassword = () => {
    const { platformAccount = false, tenants = [] } = resolveResult ?? {};
    const hadChoice =
      (platformAccount && tenants.length >= 1) || tenants.length > 1;
    if (hadChoice) {
      setPhase('CHOICE');
      setLoginCtx(null);
    } else {
      reset();
    }
  };

  // ─── Sub-estados do CHOICE ────────────────────────────────────────────────

  const isNotFound =
    resolveResult &&
    !resolveResult.platformAccount &&
    resolveResult.tenants.length === 0;
  const isMultiContext =
    resolveResult &&
    resolveResult.platformAccount &&
    resolveResult.tenants.length >= 1;
  const isMultiTenant =
    resolveResult &&
    !resolveResult.platformAccount &&
    resolveResult.tenants.length > 1;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary" />
          <span className="text-2xl font-bold">Trivestia</span>
        </Link>

        {/* ── Phase EMAIL ── */}
        {phase === 'EMAIL' && (
          <>
            <h1 className="mb-2 text-3xl font-extrabold">Entrar</h1>
            <p className="mb-8 text-muted-foreground">
              Informe seu e-mail para continuar.
            </p>

            <form
              onSubmit={handleEmail(onResolve)}
              className="space-y-4"
              noValidate
            >
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium"
                  htmlFor="email"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="voce@email.com"
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  {...regEmail('email')}
                />
                {emailErrors.email && (
                  <p className="mt-1 text-xs text-destructive">
                    {emailErrors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={resolving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-60"
              >
                {resolving && <Loader2 className="h-4 w-4 animate-spin" />}
                Continuar
              </button>
            </form>
          </>
        )}

        {/* ── Phase CHOICE ── */}
        {phase === 'CHOICE' && (
          <>
            <button
              onClick={reset}
              className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Trocar e-mail
            </button>

            <p className="mb-6 rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {email}
            </p>

            {/* Nenhuma conta encontrada */}
            {isNotFound && (
              <>
                <h1 className="mb-2 text-2xl font-extrabold">
                  Nenhuma conta encontrada
                </h1>
                <p className="mb-6 text-sm text-muted-foreground">
                  Este e-mail nao esta associado a nenhuma conta existente.
                </p>

                <Link
                  to="/register"
                  className="mb-3 flex w-full items-center justify-center rounded-lg border-2 border-primary bg-primary/5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  Criar conta de professor
                </Link>

                <div className="relative my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">ou</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <p className="mb-2 text-sm font-medium">Tenho uma escola</p>
                <p className="mb-3 text-xs text-muted-foreground">
                  Informe o identificador da escola para criar uma conta como
                  aluno.
                </p>
                <div className="flex gap-2">
                  <div className="flex flex-1 items-center gap-1 rounded-lg border bg-background px-3 text-sm">
                    <span className="shrink-0 text-muted-foreground">/t/</span>
                    <input
                      type="text"
                      value={schoolSlug}
                      onChange={(e) =>
                        setSchoolSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, '')
                        )
                      }
                      placeholder="slug-da-escola"
                      className="flex-1 bg-transparent py-2 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={schoolSlug.length < 3}
                    onClick={() => navigate(`/t/${schoolSlug}/register`)}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent disabled:opacity-40"
                  >
                    Acessar
                  </button>
                </div>
              </>
            )}

            {/* Aluno em multiplas escolas */}
            {isMultiTenant && (
              <>
                <h1 className="mb-2 text-2xl font-extrabold">
                  Selecionar escola
                </h1>
                <p className="mb-6 text-sm text-muted-foreground">
                  Sua conta existe em mais de uma escola. Escolha em qual deseja
                  entrar.
                </p>

                <div className="space-y-2">
                  {resolveResult!.tenants.map((t) => (
                    <button
                      key={t.slug}
                      onClick={() =>
                        selectCtx({
                          type: 'tenant',
                          slug: t.slug,
                          name: t.name
                        })
                      }
                      className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3.5 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      {t.name}
                      <span className="text-xs text-muted-foreground">
                        /t/{t.slug}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Conta de professor + aluno em escola(s) */}
            {isMultiContext && (
              <>
                <h1 className="mb-2 text-2xl font-extrabold">
                  Como deseja entrar?
                </h1>
                <p className="mb-6 text-sm text-muted-foreground">
                  Este e-mail possui conta de professor e tambem esta associado
                  a escolas como aluno.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => selectCtx({ type: 'platform' })}
                    className="flex w-full flex-col items-start rounded-xl border-2 border-primary bg-primary/5 px-4 py-3.5 text-left text-sm transition-colors hover:bg-primary/10"
                  >
                    <span className="font-semibold">
                      Professor — conta da plataforma
                    </span>
                    <span className="mt-0.5 text-xs text-muted-foreground">
                      Acesse o workspace para gerenciar sua escola
                    </span>
                  </button>

                  {resolveResult!.tenants.map((t) => (
                    <button
                      key={t.slug}
                      onClick={() =>
                        selectCtx({
                          type: 'tenant',
                          slug: t.slug,
                          name: t.name
                        })
                      }
                      className="flex w-full flex-col items-start rounded-xl border px-4 py-3.5 text-left text-sm transition-colors hover:bg-accent"
                    >
                      <span className="font-semibold">Aluno — {t.name}</span>
                      <span className="mt-0.5 text-xs text-muted-foreground">
                        /t/{t.slug}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Phase PASSWORD ── */}
        {phase === 'PASSWORD' && loginCtx && (
          <>
            <button
              onClick={backFromPassword}
              className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <h1 className="mb-1 text-3xl font-extrabold">
              {loginCtx.type === 'platform' ? 'Acesso professor' : 'Entrar'}
            </h1>
            <p className="mb-3 text-sm text-muted-foreground">{email}</p>

            {loginCtx.type === 'tenant' && (
              <p className="mb-6 inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1 text-xs font-medium">
                Escola: {loginCtx.name}
              </p>
            )}
            {loginCtx.type === 'platform' && (
              <p className="mb-6 inline-flex items-center gap-1.5 rounded-full border bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Conta da plataforma
              </p>
            )}

            <form
              onSubmit={handlePwd(onLogin)}
              className="space-y-4"
              noValidate
            >
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
                    autoFocus
                    placeholder="••••••••"
                    className="w-full rounded-lg border bg-background px-4 py-2.5 pr-10 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    {...regPwd('password')}
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
                {pwdErrors.password && (
                  <p className="mt-1 text-xs text-destructive">
                    {pwdErrors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={logging}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-60"
              >
                {logging && <Loader2 className="h-4 w-4 animate-spin" />}
                Entrar
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
