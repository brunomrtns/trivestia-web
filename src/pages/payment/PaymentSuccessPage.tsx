import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { paymentEndpoints } from '@/services/endpoints/payment.endpoints';
import { authStorage } from '@/features/auth/storage';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const result = await paymentEndpoints.getPaymentStatus(sessionId);
        if (result.status === 'SUCCEEDED' && result.kind === 'school_creation') {
          clearInterval(interval);
          setStatus('success');
          setTenantSlug(null);
        } else if (result.status === 'SUCCEEDED') {
          clearInterval(interval);
          setStatus('success');
          setTenantSlug(result.tenantId);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setStatus('error');
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setStatus('error');
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [searchParams]);

  const lastSlug = authStorage.getLastTenantSlug();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
            <h1 className="mt-6 text-2xl font-bold">
              Processando pagamento...
            </h1>
            <p className="mt-2 text-muted-foreground">
              Aguarde enquanto confirmamos seu pagamento.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="mt-6 text-2xl font-bold">Pagamento confirmado!</h1>
            <p className="mt-2 text-muted-foreground">
              Sua escola foi criada com sucesso.
            </p>
            <button
              onClick={() =>
                navigate(
                  lastSlug
                    ? `/t/${lastSlug}/login`
                    : '/login'
                )
              }
              className="mt-8 rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
            >
              Ir para login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-16 w-16 text-destructive" />
            <h1 className="mt-6 text-2xl font-bold">
              Não foi possível confirmar o pagamento
            </h1>
            <p className="mt-2 text-muted-foreground">
              Se o pagamento foi realizado, aguarde alguns minutos e tente
              fazer login.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-8 rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
            >
              Ir para login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
