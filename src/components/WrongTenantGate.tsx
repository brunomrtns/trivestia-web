import { ShieldX, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WrongTenantGateProps {
  /** Slug do tenant onde o usuário está autenticado */
  correctSlug: string;
}

/**
 * Tela exibida quando o usuário tenta acessar um tenant diferente do seu.
 * Substitui o redirect para a LoginPage (que causava loop infinito).
 */
export function WrongTenantGate({ correctSlug }: WrongTenantGateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        {/* Ícone */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-5">
            <ShieldX className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Texto */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Acesso negado</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Você está autenticado na escola{' '}
            <span className="font-semibold text-foreground">{correctSlug}</span>{' '}
            e não tem permissão para acessar esta escola.
          </p>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() =>
              navigate(`/t/${correctSlug}/app/dashboard`, { replace: true })
            }
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir para minha escola
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
