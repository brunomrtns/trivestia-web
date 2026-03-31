import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { paymentEndpoints } from '@/services/endpoints/payment.endpoints';
import { usePlatformAuthStore } from '@/features/platform/platform.store';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = usePlatformAuthStore();
  const tenantSlug = user?.tenantId ? undefined : undefined;
  const [loading, setLoading] = useState(false);
  const [connectStatus, setConnectStatus] = useState<{
    hasAccount: boolean;
    onboardingComplete: boolean;
    chargesEnabled: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    try {
      const lastSlug = localStorage.getItem('@tm:lastTenantSlug');
      if (!lastSlug) {
        setError('Nenhuma escola encontrada');
        setLoading(false);
        return;
      }
      const status = await paymentEndpoints.getConnectStatus(lastSlug);
      setConnectStatus(status);
    } catch {
      setError('Erro ao verificar status da conta');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartOnboarding() {
    setLoading(true);
    setError(null);
    try {
      const lastSlug = localStorage.getItem('@tm:lastTenantSlug');
      if (!lastSlug) {
        setError('Nenhuma escola encontrada');
        return;
      }

      if (!connectStatus?.hasAccount) {
        await paymentEndpoints.createConnectAccount(lastSlug);
      }

      const { url } = await paymentEndpoints.createOnboardingLink(lastSlug);
      window.location.href = url;
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? 'Erro ao iniciar onboarding'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container max-w-lg py-16">
      <h1 className="mb-2 text-3xl font-extrabold">
        Configuração Financeira
      </h1>
      <p className="mb-8 text-muted-foreground">
        Configure sua conta para receber repasses dos pagamentos dos alunos.
      </p>

      {loading && !connectStatus && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mb-1 inline h-4 w-4" /> {error}
        </div>
      )}

      {connectStatus?.onboardingComplete && (
        <div className="mb-6 rounded-lg border border-green-500/50 bg-green-500/10 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-700">
              Onboarding completo
            </span>
          </div>
          <p className="mt-1 text-sm text-green-600">
            Sua conta está configurada para receber pagamentos.
            {connectStatus.chargesEnabled
              ? ' Cobranças habilitadas.'
              : ' Aguardando habilitação de cobranças.'}
          </p>
        </div>
      )}

      {connectStatus && !connectStatus.onboardingComplete && (
        <div className="space-y-4">
          <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
            <p className="text-sm text-yellow-700">
              {connectStatus.hasAccount
                ? 'Seu onboarding ainda não foi concluído. Clique abaixo para continuar.'
                : 'Você precisa configurar sua conta Stripe Connect para receber repasses.'}
            </p>
          </div>

          <button
            onClick={handleStartOnboarding}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {connectStatus.hasAccount
              ? 'Continuar Onboarding'
              : 'Iniciar Configuração'}
          </button>
        </div>
      )}

      {connectStatus?.onboardingComplete && (
        <button
          onClick={() => {
            const lastSlug = localStorage.getItem('@tm:lastTenantSlug');
            if (lastSlug) navigate(`/t/${lastSlug}/admin/courses`);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
        >
          Voltar para o painel
        </button>
      )}
    </div>
  );
}
