import { useState } from 'react';
import { Portal } from '@/components/ui/Portal';
import {
  X,
  HelpCircle,
  BookOpen,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  DollarSign,
  BarChart3,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface HelpDrawerProps {
  open: boolean;
  onClose: () => void;
  onRestartTutorial?: () => void;
}

// ─── Glossary ─────────────────────────────────────────────────────────────────

interface GlossaryEntry {
  term: string;
  description: string;
  icon?: React.ReactNode;
  category: 'ordens' | 'conceitos' | 'indicadores';
}

const GLOSSARY: GlossaryEntry[] = [
  // Ordens
  {
    term: 'BUY (Compra)',
    description:
      'Ordem de compra. Você lucra quando o preço sobe após a compra. Abre uma posição LONG.',
    icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />,
    category: 'ordens'
  },
  {
    term: 'SELL (Venda)',
    description:
      'Ordem de venda. Permite "vender a descoberto" (short) — você lucra quando o preço cai. Abre uma posição SHORT.',
    icon: <TrendingDown className="h-3.5 w-3.5 text-red-400" />,
    category: 'ordens'
  },
  {
    term: 'MARKET (A Mercado)',
    description:
      'Executa imediatamente ao preço atual do mercado. Mais rápida, mas pode ter slippage.',
    icon: <DollarSign className="h-3.5 w-3.5 text-primary" />,
    category: 'ordens'
  },
  {
    term: 'LIMIT (Limitada)',
    description:
      'Executa somente se o preço atingir o valor definido. BUY LIMIT: executa abaixo do preço definido. SELL LIMIT: acima.',
    icon: <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />,
    category: 'ordens'
  },
  {
    term: 'STOP',
    description:
      'Executa quando o preço atinge o trigger. BUY STOP: compra acima do atual (rompimento). SELL STOP: vende abaixo.',
    icon: <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />,
    category: 'ordens'
  },
  {
    term: 'Stop-Loss (SL)',
    description:
      'Nível de preço que fecha sua posição automaticamente para limitar perdas. Fundamental para gestão de risco.',
    icon: <ShieldCheck className="h-3.5 w-3.5 text-red-400" />,
    category: 'ordens'
  },
  {
    term: 'Take-Profit (TP)',
    description:
      'Nível de preço que fecha sua posição automaticamente para garantir lucro. Ajuda a realizar ganhos.',
    icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />,
    category: 'ordens'
  },

  // Conceitos
  {
    term: 'PnL (Profit & Loss)',
    description:
      'Lucro ou prejuízo da sua operação. PnL positivo = lucro. Negativo = prejuízo. Mostrado em $ e %.',
    icon: <DollarSign className="h-3.5 w-3.5 text-foreground" />,
    category: 'conceitos'
  },
  {
    term: 'Equity (Patrimônio)',
    description:
      'Seu saldo + PnL das posições abertas. Reflete o valor real da sua conta em tempo real.',
    icon: <BarChart3 className="h-3.5 w-3.5 text-primary" />,
    category: 'conceitos'
  },
  {
    term: 'Posição',
    description:
      'Quando você tem uma operação aberta. LONG = comprado (aposta na alta). SHORT = vendido (aposta na queda). FLAT = sem posição.',
    icon: <BarChart3 className="h-3.5 w-3.5 text-foreground" />,
    category: 'conceitos'
  },
  {
    term: 'Fee / Taxa',
    description:
      'Custo por operação cobrado em cada execução (fill). Medido em bps (basis points). 1 bps = 0.01%.',
    icon: <DollarSign className="h-3.5 w-3.5 text-orange-400" />,
    category: 'conceitos'
  },
  {
    term: 'Slippage',
    description:
      'Diferença entre o preço esperado e o preço real de execução. Simulado automaticamente pelo engine.',
    icon: <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />,
    category: 'conceitos'
  },
  {
    term: 'Spread',
    description:
      'Diferença entre o preço de compra (ask) e venda (bid). Custo implícito de operar.',
    icon: <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />,
    category: 'conceitos'
  },

  // Indicadores
  {
    term: 'Drawdown',
    description:
      'Queda do patrimônio em relação ao pico máximo. Mede o pior momento da sua operação. Menor = melhor gestão de risco.',
    icon: <AlertTriangle className="h-3.5 w-3.5 text-red-400" />,
    category: 'indicadores'
  },
  {
    term: 'Win Rate',
    description:
      'Percentual de trades vencedores. 60%+ é considerado bom. Porém, depende também da relação risco/retorno.',
    icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />,
    category: 'indicadores'
  },
  {
    term: 'Sharpe Ratio',
    description:
      'Mede o retorno ajustado ao risco. >1 = bom, >2 = excelente. Penaliza oscilações grandes nos resultados.',
    icon: <BarChart3 className="h-3.5 w-3.5 text-blue-400" />,
    category: 'indicadores'
  },
  {
    term: 'Profit Factor',
    description:
      'Soma dos ganhos ÷ soma das perdas. >1 = lucrativo. >2 = estratégia consistente.',
    icon: <DollarSign className="h-3.5 w-3.5 text-emerald-400" />,
    category: 'indicadores'
  }
];

const CATEGORIES = [
  { key: 'ordens' as const, label: 'Tipos de Ordem', icon: BookOpen },
  { key: 'conceitos' as const, label: 'Conceitos', icon: HelpCircle },
  {
    key: 'indicadores' as const,
    label: 'Indicadores',
    icon: BarChart3
  }
];

// ─── Component ────────────────────────────────────────────────────────────────

export function HelpDrawer({
  open,
  onClose,
  onRestartTutorial
}: HelpDrawerProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    'ordens'
  );

  if (!open) return null;

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold">Central de Ajuda</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Quick tips */}
          <div className="border-b px-4 py-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Dicas Rápidas
            </h3>
            <div className="space-y-2 text-sm">
              <QuickTip
                emoji=""
                text="Use Play/Pause para controlar o avanço das velas"
              />
              <QuickTip
                emoji=""
                text="O gráfico mostra candles — cada vela = 1 período"
              />
              <QuickTip
                emoji=""
                text="Comece com ordens MARKET pequenas para entender o fluxo"
              />
              <QuickTip
                emoji=""
                text="Sempre defina Stop-Loss para limitar perdas"
              />
              <QuickTip
                emoji=""
                text="Acompanhe seu Equity e Drawdown em tempo real"
              />
              <QuickTip
                emoji=""
                text="Clique 'Enviar Resultado' quando as velas acabarem"
              />
            </div>
          </div>

          {/* Glossary accordion */}
          <div className="px-4 py-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Glossário
            </h3>

            {CATEGORIES.map((cat) => {
              const items = GLOSSARY.filter((g) => g.category === cat.key);
              const isExpanded = expandedCategory === cat.key;

              return (
                <div key={cat.key} className="mb-2">
                  <button
                    onClick={() =>
                      setExpandedCategory(isExpanded ? null : cat.key)
                    }
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-accent"
                  >
                    <cat.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-left">{cat.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {items.length}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 text-muted-foreground transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-1 space-y-1.5 pl-2">
                      {items.map((entry) => (
                        <div
                          key={entry.term}
                          className="rounded-lg border bg-card p-3"
                        >
                          <div className="flex items-center gap-2">
                            {entry.icon}
                            <span className="text-sm font-semibold">
                              {entry.term}
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            {entry.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3">
          {onRestartTutorial && (
            <button
              onClick={() => {
                onRestartTutorial();
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar Tutorial
            </button>
          )}
        </div>
      </div>
    </Portal>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function QuickTip({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
      <span className="text-base">{emoji}</span>
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}
