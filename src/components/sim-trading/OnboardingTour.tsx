import { useCallback } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  BarChart3,
  ListOrdered,
  TrendingUp,
  FileText,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTutorialProgress } from './useTutorialProgress';

// ─── Tutorial Steps ───────────────────────────────────────────────────────────

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlightArea?: string; // CSS class hint for devs
}

const STEPS: TutorialStep[] = [
  {
    id: 'chart',
    title: 'Entenda o Gráfico',
    description:
      'Este é o gráfico de velas (candlestick). Cada vela representa um período de tempo. ' +
      'Vela verde = preço subiu. Vela vermelha = preço caiu. ' +
      'O corpo mostra abertura/fechamento e os pavios mostram máxima/mínima.',
    icon: <BarChart3 className="h-5 w-5 text-primary" />,
    highlightArea: 'chart'
  },
  {
    id: 'playback',
    title: 'Controles de Playback',
    description:
      'Use os botões de Play/Pause para avançar as velas automaticamente. ' +
      'O botão "→" avança uma vela por vez. ' +
      'Ajuste a velocidade (0.5× a 4×). Observe o mercado antes de operar!',
    icon: <ListOrdered className="h-5 w-5 text-blue-400" />,
    highlightArea: 'playback'
  },
  {
    id: 'order',
    title: 'Abra sua Primeira Ordem',
    description:
      'No painel "Nova Ordem", escolha BUY (compra) ou SELL (venda). ' +
      'Selecione o tipo: MARKET (imediata), LIMIT (preço específico) ou STOP (gatilho). ' +
      'Defina a quantidade e, opcionalmente, Stop-Loss (SL) e Take-Profit (TP).',
    icon: <TrendingUp className="h-5 w-5 text-emerald-400" />,
    highlightArea: 'order-ticket'
  },
  {
    id: 'position',
    title: 'Acompanhe sua Posição',
    description:
      'Após uma ordem ser executada (fill), sua posição aparece no painel lateral. ' +
      'Acompanhe o PnL em tempo real. ' +
      'Use o botão "Fechar" para encerrar a posição a qualquer momento.',
    icon: <FileText className="h-5 w-5 text-yellow-400" />,
    highlightArea: 'position-panel'
  },
  {
    id: 'tabs',
    title: 'Ordens, Fills e Métricas',
    description:
      'Na parte inferior: "Ordens" mostra ordens pendentes (LIMIT/STOP). ' +
      '"Preenchimentos" mostra todas as execuções realizadas. ' +
      '"Métricas" mostra estatísticas da sua performance (Win Rate, Sharpe, etc.).',
    icon: <BarChart3 className="h-5 w-5 text-muted-foreground" />,
    highlightArea: 'bottom-tabs'
  },
  {
    id: 'submit',
    title: 'Finalize e Envie',
    description:
      'Quando todas as velas forem exibidas, o botão "Enviar Resultado" aparece. ' +
      'Clique para submeter sua simulação ao servidor. ' +
      'Ele recalcula tudo e gera sua pontuação final. Boa sorte!',
    icon: <Send className="h-5 w-5 text-primary" />,
    highlightArea: 'submit'
  }
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface OnboardingTourProps {
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OnboardingTour({ className }: OnboardingTourProps) {
  const tutorial = useTutorialProgress();

  const handleNext = useCallback(() => {
    if (tutorial.currentStep >= STEPS.length - 1) {
      tutorial.complete();
    } else {
      tutorial.nextStep();
    }
  }, [tutorial]);

  const handlePrev = useCallback(() => {
    if (tutorial.currentStep > 0) {
      tutorial.setStep(tutorial.currentStep - 1);
    }
  }, [tutorial]);

  // Don't render if completed or dismissed
  if (tutorial.completed || tutorial.dismissed) return null;

  const step = STEPS[tutorial.currentStep];
  if (!step) return null;

  const isFirst = tutorial.currentStep === 0;
  const isLast = tutorial.currentStep === STEPS.length - 1;
  const progress = ((tutorial.currentStep + 1) / STEPS.length) * 100;

  return (
    <div
      className={cn(
        'rounded-xl border border-primary/20 bg-card shadow-lg',
        className
      )}
    >
      {/* Progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-t-xl bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            {step.icon}
            <div>
              <h3 className="text-sm font-bold">{step.title}</h3>
              <span className="text-xs text-muted-foreground">
                Passo {tutorial.currentStep + 1} de {STEPS.length}
              </span>
            </div>
          </div>
          <button
            onClick={tutorial.dismiss}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            title="Fechar tutorial"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Description */}
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
          {step.description}
        </p>

        {/* Step dots */}
        <div className="mb-3 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => tutorial.setStep(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === tutorial.currentStep
                  ? 'w-4 bg-primary'
                  : i < tutorial.currentStep
                    ? 'w-1.5 bg-primary/40'
                    : 'w-1.5 bg-muted-foreground/30'
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-accent disabled:opacity-30"
          >
            <ChevronLeft className="h-3 w-3" />
            Anterior
          </button>

          <div className="flex-1" />

          <button
            onClick={tutorial.dismiss}
            className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            Pular
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {isLast ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Concluir
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
